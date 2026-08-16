import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import { hintLogger as log } from "@/lib/logger/logger.scopes";

import { challengeService } from "@/modules/challenge/services/challenge.service";
import { leaderboardRepository } from "@/modules/leaderboard/repositories/leaderboard.repository";

import { hintRepository } from "../repositories/hint.repository";
import { toChallengeHintDTO, toHintUnlockDTO } from "../utils/hint.mapper";
import {
  isHintUnlocked,
  hasUnlockedPreviousLevel,
  canUnlockHint,
} from "../utils/hint-access";
import { hasEnoughXp, normalizeXpCost } from "../utils/hint-pricing";
import type { HintWithPlayerState } from "../types/hint.types";
import type { HintListDTO, HintUnlockDTO } from "../types/hint.dto";
import { challengeAccessService } from "@/modules/challenge/services/challenge-access.service";

// ============================================================================
// hint.service.ts
// ============================================================================
//
// Orchestration only: sequences repository reads, applies business rules
// via hint-access.ts and hint-pricing.ts, opens the one transaction that
// makes an unlock durable, and hands the result to hint.mapper.ts. This
// file owns no persistence logic, no pure algorithms, and no DTO
// shaping — every one of those already has a home, and this file's job
// is calling them in the right order with the right data.
//
// WHY SERVICES ORCHESTRATE INSTEAD OF QUERYING PRISMA DIRECTLY
// ------------------------------------------------------------------
// hint.repository.ts already knows how to fetch efficiently; this file
// has no business re-deriving query shape. Every Prisma interaction
// here goes through hintRepository or leaderboardRepository — never a
// raw `prisma.hint.*` or `prisma.playerHint.*` call.
//
// WHY TRANSACTIONS BELONG HERE
// ---------------------------------
// PlayerHint creation and the XP deduction are writes to two different
// tables owned by two different repositories. Neither repository can
// correctly own a transaction that spans the other's table — only the
// layer calling both can, which is this file.
//
// WHY GAMEPLAY HINT UNLOCKS DO NOT GENERATE AN AuditLog ENTRY
// -----------------------------------------------------------------
// Already decided when hint.events.ts was built, restated here because
// this is where it would be tempting to add one anyway: PlayerHint
// already stores who (userId), what (hintId), when (unlockedAt), and
// the exact amount spent (xpSpent) — a complete, correctly-typed,
// permanent record. A dedicated audit event would be the identical
// redundancy FIRST_BLOOD was removed for elsewhere in this project.
// This file never imports audit.service.ts.
//
// DEPENDENCY ON leaderboard.repository.ts — decrementXp() IS A PROPOSED ADDITION
// -------------------------------------------------------------------------------
// The XP deduction below calls `leaderboardRepository.decrementXp(tx,
// userId, amount)`. As of this file, that method does not yet exist in
// leaderboard.repository.ts — every method confirmed there so far
// (findLiveRank, findFrozenRank, upsertForSolve, the find*Entries reads)
// reads rank/XP or upserts a SOLVE, none decrement an existing balance.
// A companion patch has been proposed for leaderboard.repository.ts: a
// plain conditional UPDATE (not an upsert — there's no sensible default
// for solvedChallenges/highestChapter to fabricate for a row that
// shouldn't exist just because someone spent XP), atomic against the
// same read-then-write race hint-pricing.ts's header argues against,
// returning whether the decrement actually applied. This file assumes
// that method lands before it runs — it is not something hint.service.ts
// can add itself without touching another module's repository.
// ============================================================================

class HintService {
  /**
   * Every published hint for a challenge, from this player's
   * perspective — `canUnlock` on each one reflects BOTH order
   * eligibility (hint-access.ts) AND affordability (hint-pricing.ts),
   * since ChallengeHintDTO's own contract requires both. No transaction
   * — this is a pure read.
   */
  async getChallengeHints(
    userId: string,
    challengeId: string,
  ): Promise<HintListDTO> {
    await this.assertChallengeAccessible(userId, challengeId);

    const [hints, currentXp] = await Promise.all([
      hintRepository.findChallengeHints(prisma, userId, challengeId),
      this.resolveCurrentXp(userId),
    ]);

    const dtos = hints.map((state) => {
      const previousLevelUnlocked = hasUnlockedPreviousLevel(
        hints,
        state.hint.level,
      );
      const isEligible =
        !isHintUnlocked(state) &&
        previousLevelUnlocked &&
        hasEnoughXp(currentXp, state.hint.xpCost);
      return toChallengeHintDTO(state, isEligible, previousLevelUnlocked);
    });

    return { challengeId, hints: dtos };
  }

  /**
   * Unlocks one hint for a player. Every rejection below is checked
   * BEFORE the transaction opens, so the common paths (already
   * unlocked, wrong order, can't afford it) never pay for one — only a
   * request that clears every pre-check reaches the actual write.
   */
  async unlockHint(userId: string, hintId: string): Promise<HintUnlockDTO> {
    const targetHint = await hintRepository.findHintById(prisma, hintId);

    if (!targetHint) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Hint not found.");
    }

    await this.assertChallengeAccessible(userId, targetHint.challengeId);

    const hints = await hintRepository.findChallengeHints(
      prisma,
      userId,
      targetHint.challengeId,
    );
    const targetState = this.findHintState(hints, hintId);

    if (!targetState) {
      // Defensive — targetHint was just resolved as PUBLISHED for this
      // exact challengeId, so it must appear in this challenge-scoped
      // fetch. Reaching here means the two queries disagreed between
      // calls — a genuine data race or integrity problem, not a normal
      // rejection, so this gets a real log signal rather than a silent
      // 404 indistinguishable from "hint never existed."
      log.error(
        "Hint resolved individually but missing from its own challenge-scoped fetch",
        undefined,
        { userId, hintId, challengeId: targetHint.challengeId },
      );
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Hint not found.");
    }

    // Optimistic UX only — this reads a snapshot taken before the
    // transaction opens, so it cannot by itself prevent two concurrent
    // requests for the same hint from both passing. PlayerHint's
    // composite primary key (userId, hintId) is the actual, authoritative
    // guarantee; a race that slips past this check is resolved by the
    // database rejecting the losing INSERT with P2002, caught below and
    // translated into the same ALREADY_UNLOCKED response.
    if (isHintUnlocked(targetState)) {
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "You have already unlocked this hint.",
      );
    }

    if (!hasUnlockedPreviousLevel(hints, targetState.hint.level)) {
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "You must unlock the previous hint first.",
      );
    }

    const currentXp = await this.resolveCurrentXp(userId);
    const cost = normalizeXpCost(targetState.hint.xpCost);

    if (!hasEnoughXp(currentXp, cost)) {
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "You do not have enough XP to unlock this hint.",
      );
    }

    let playerHint;

    try {
      playerHint = await prisma.$transaction(async (tx) => {
        let created;

        try {
          created = await hintRepository.createPlayerHint(tx, {
            userId,
            hintId,
            xpSpent: cost,
          });
        } catch (error) {
          // The race the pre-check above can't fully close: a concurrent
          // request for this exact hint won and committed first.
          // PlayerHint's composite primary key rejects the second
          // INSERT with P2002 — detected narrowly (only this code, only
          // this error type) so any other Prisma failure still surfaces
          // as the real unexpected error it is, not a false
          // ALREADY_UNLOCKED.
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            throw ApiError.conflict(
              ErrorCode.VALIDATION_ERROR,
              "You have already unlocked this hint.",
            );
          }
          throw error;
        }

        // A free hint (cost === 0, e.g. LEVEL_1 by default) has nothing
        // to deduct — skipped entirely rather than calling decrementXp
        // with amount 0. decrementXp's conditional UPDATE affects zero
        // rows for a user with no LeaderboardEntry at all, regardless of
        // amount, which would otherwise reject a free unlock for a
        // player who hasn't solved anything yet. This skip is safe, not
        // a special case masking a real failure: cost > 0 can only
        // happen when a LeaderboardEntry row must already exist — there
        // is no way to have spendable XP without one.
        if (cost > 0) {
          const deducted = await leaderboardRepository.decrementXp(
            tx,
            userId,
            cost,
          );

          if (!deducted) {
            // The pre-check above passed, but a concurrent request (a
            // second unlock, or some other XP-spending action) won the
            // race between then and now. Thrown INSIDE the transaction —
            // Prisma rolls back the PlayerHint insert above along with
            // it, so neither write takes effect.
            throw ApiError.conflict(
              ErrorCode.VALIDATION_ERROR,
              "You do not have enough XP to unlock this hint.",
            );
          }
        }

        return created;
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;

      log.error("Unexpected error during hint unlock transaction", error, {
        userId,
        hintId,
      });
      throw error;
    }

    log.info("Hint unlocked", { userId, hintId, xpSpent: cost });

    return toHintUnlockDTO({ hint: targetState.hint, playerHint });
  }

  // --------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------

  /**
   * Independently re-derives challenge access for hint requests — never
   * assumes the player legitimately reached this point. Mirrors
   * SubmissionService.assertChallengeAccessible exactly: same
   * ChallengeAccessService call, same generic NOT_FOUND regardless of
   * WHY access was denied (challenge doesn't exist, event not live,
   * this isn't the player's current gate, an unmet prerequisite) — a
   * player probing this endpoint learns nothing about which reason
   * applied. This closes a real gap: hint content is answer-adjacent,
   * so a player must not be able to view or unlock hints for a
   * challenge that isn't currently theirs, or whose prerequisites
   * aren't met, just by supplying its id.
   */
  private async assertChallengeAccessible(
    userId: string,
    challengeId: string,
  ): Promise<void> {
    const access = await challengeAccessService.evaluateChallengeAccess(
      userId,
      challengeId,
    );

    if (!access.isAuthorized) {
      log.warn("Hint request denied by ChallengeAccessService", {
        userId,
        challengeId,
        deniedReason: access.deniedReason,
      });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Challenge not found.");
    }
  }

  /**
   * A player's current XP balance, defaulting to 0 when no
   * LeaderboardEntry exists yet (a player who hasn't solved anything).
   * Shared by both public methods so "where XP comes from" is decided
   * in exactly one place in this file.
   */
  private async resolveCurrentXp(userId: string): Promise<number> {
    const rank = await leaderboardRepository.findLiveRank(prisma, userId);
    return rank?.totalXp ?? 0;
  }

  /**
   * Locates one hint's paired player-state within an already-fetched
   * challenge-scoped array, by id. Not unlock-order logic — hint-access.ts
   * owns that — this is only ever a plain lookup connecting
   * findHintById's bare Hint to its per-player state from a second,
   * already-issued query.
   */
  private findHintState(
    hints: readonly HintWithPlayerState[],
    hintId: string,
  ): HintWithPlayerState | undefined {
    return hints.find((state) => state.hint.id === hintId);
  }
}

export const hintService = new HintService();
