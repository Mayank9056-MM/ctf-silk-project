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
import { HINT_MESSAGES } from "../constants/hint.messages";
import { UNLOCK_MESSAGES } from "../constants/hint.messages";
import type { HintWithPlayerState } from "../types/hint.types";
import type { HintListDTO, HintUnlockDTO } from "../types/hint.dto";

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
    await this.assertChallengeExists(challengeId);

    const [hints, currentXp] = await Promise.all([
      hintRepository.findChallengeHints(prisma, userId, challengeId),
      this.resolveCurrentXp(userId),
    ]);

    const dtos = hints.map((state) => {
      const isEligible =
        canUnlockHint(hints, state) &&
        hasEnoughXp(currentXp, state.hint.xpCost);
      return toChallengeHintDTO(state, isEligible);
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
      throw ApiError.notFound(ErrorCode.NOT_FOUND, HINT_MESSAGES.NOT_FOUND);
    }

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
      throw ApiError.notFound(ErrorCode.NOT_FOUND, HINT_MESSAGES.NOT_FOUND);
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
        UNLOCK_MESSAGES.ALREADY_UNLOCKED,
      );
    }

    if (!hasUnlockedPreviousLevel(hints, targetState.hint.level)) {
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        UNLOCK_MESSAGES.PREVIOUS_HINT_REQUIRED,
      );
    }

    const currentXp = await this.resolveCurrentXp(userId);
    const cost = normalizeXpCost(targetState.hint.xpCost);

    if (!hasEnoughXp(currentXp, cost)) {
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        UNLOCK_MESSAGES.INSUFFICIENT_XP,
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
              UNLOCK_MESSAGES.ALREADY_UNLOCKED,
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
              UNLOCK_MESSAGES.INSUFFICIENT_XP,
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
   * Confirms a challenge exists before this module does anything
   * challenge-scoped. Necessary, not decorative: an empty hint list is
   * a legitimate outcome for a real challenge with no authored hints,
   * so "zero hints returned" alone can never distinguish "challenge
   * doesn't exist" from "challenge exists, has none yet." Re-wraps
   * challengeService's own NOT_FOUND into HINT_MESSAGES.CHALLENGE_NOT_FOUND
   * rather than passing its message through directly — this module owns
   * its own user-facing wording independently of how the Challenge
   * module phrases its own 404s.
   */
  private async assertChallengeExists(challengeId: string): Promise<void> {
    try {
      await challengeService.getChallengeById(challengeId);
    } catch (error) {
      // Only a genuine "no such challenge" gets remapped to this
      // module's own wording. Any other ApiError (forbidden, rate
      // limited, an internal failure) is rethrown as-is — swallowing
      // those into CHALLENGE_NOT_FOUND would hide a different, possibly
      // more urgent problem behind a misleading 404.
      if (error instanceof ApiError && error.code === ErrorCode.NOT_FOUND) {
        throw ApiError.notFound(
          ErrorCode.NOT_FOUND,
          HINT_MESSAGES.CHALLENGE_NOT_FOUND,
        );
      }
      throw error;
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
