import { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import { eventService } from "@/modules/event/services/event.service";
import { challengeRepository } from "@/modules/challenge/repositories/challenge.repository";
import { challengeAccessService } from "@/modules/challenge/services/challenge-access.service";
import { storyNavigationService } from "@/modules/story/services/story-navigation.service";
import { flagService } from "@/modules/challenge/services/flag.service";
import { hashFlag } from "@/modules/challenge/utils/hash-flag";

import { submissionLogger as log } from "@/lib/logger/logger.scopes";
import { submissionRepository } from "../repositories/submission.repository";
import { toSubmissionDTOList } from "../utils/submission.mapper";
import { SUBMISSION_CONSTANTS } from "../constants/submission.constants";
import type { SubmitFlagInput } from "../validations/submit-flag.schema";
import type { SubmitFlagOutcome } from "../types/submission.types";
import type { SubmissionDTO } from "../types/submission.dto";

/**
 * Owns the write path for every flag attempt and the read path for a
 * player's own submission history. Challenge/flag data itself (flagHash,
 * xpReward) stays the Challenge module's responsibility — this service
 * depends on ChallengeRepository/flagService, never duplicates their
 * logic. Challenge ACCESS authorization is likewise not this service's
 * to decide — it depends on ChallengeAccessService rather than
 * re-deriving "is this player allowed to attempt this challenge" itself.
 */
class SubmissionService {
  /**
   * Verifies a submitted flag and records the attempt.
   *
   * Order of operations matters:
   *   1. Reject outside the live event window first — reusing the same
   *      derived-access check the Challenge module gates on, so a
   *      submission can never sneak through even if some other layer
   *      skipped it.
   *   2. Rate-limit BEFORE touching the challenge — a script hammering
   *      this endpoint shouldn't cost a flag comparison per request.
   *   3. Authorize via ChallengeAccessService BEFORE loading flag
   *      verification data or comparing anything. This is what closes
   *      the direct-POST bypass: a player who never opened the GET
   *      challenge page (or whose story position doesn't currently gate
   *      this challenge) is rejected here, identically to how the GET
   *      path rejects them — same generic NOT_FOUND, same
   *      ChallengeAccessService, same authorization source
   *      (StoryProgress.currentSceneId), so there is exactly one place
   *      in the codebase that decides "is this challenge currently
   *      theirs," not two that could drift apart.
   *   4. Verify the flag OUTSIDE the transaction — a pure read plus
   *      comparison, no reason to hold a DB transaction open for it.
   *      Reading challenge data outside the transaction is safe here
   *      because xpReward/flagHash are script-authored and static for
   *      the whole event — nothing else can change them mid-request.
   *   5. Record the attempt, and (if correct) the solve, INSIDE one
   *      transaction — the P2002 catch below is what actually enforces
   *      "first correct solve only," not a prior SELECT.
   */
  async submitFlag(
    userId: string,
    input: SubmitFlagInput,
  ): Promise<SubmitFlagOutcome> {
    await this.assertEventIsLive(userId);
    await this.assertNotRateLimited(userId);
    await this.assertChallengeAccessible(userId, input.challengeId);

    const challenge = await challengeRepository.getFlagVerificationData(
      input.challengeId,
    );

    if (!challenge) {
      // Defensive — ChallengeAccessService already confirmed this
      // challenge exists moments ago. Reaching this branch would mean
      // the challenge was deleted in the narrow window between that
      // check and this read; treated the same as any other
      // not-found, never surfaced differently.
      log.error(
        "Challenge vanished between access check and flag verification",
        undefined,
        { userId, challengeId: input.challengeId },
      );
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Challenge not found.");
    }

    const isCorrect = await flagService.verify(input.flag, challenge.flagHash);
    const submittedFlagHash = isCorrect ? await hashFlag(input.flag) : null;

   try {
      const outcome = await prisma.$transaction(async (tx) => {
        const submission = await submissionRepository.createSubmission(tx, {
          isCorrect,
          submittedFlagHash,
          user: { connect: { id: userId } },
          challenge: { connect: { id: input.challengeId } },
        });

        if (!isCorrect) {
          return { isCorrect: false, xpAwarded: 0, alreadySolved: false };
        }

        try {
          await submissionRepository.createSolve(tx, {
            xpAwarded: challenge.xpReward,
            user: { connect: { id: userId } },
            challenge: { connect: { id: input.challengeId } },
            submission: { connect: { id: submission.id } },
          });

          return {
            isCorrect: true,
            xpAwarded: challenge.xpReward,
            alreadySolved: false,
          };
        } catch (error) {
          if (this.isDuplicateSolve(error)) {
            return { isCorrect: true, xpAwarded: 0, alreadySolved: true };
          }
          throw error;
        }
      });

      if (outcome.isCorrect) {
        await this.advanceStoryIfCurrentGate(userId, input.challengeId);
      }

      return outcome;
    } catch (error) {
      log.error("Submission transaction failed unexpectedly", error, {
        userId,
        challengeId: input.challengeId,
        isCorrect,
      });
      throw error;
    }
  }

  /**
   * Best-effort post-solve story advance. See
   * StoryNavigationService.advanceAfterChallengeSolved's own doc for
   * its full no-op/idempotency contract.
   *
   * TRANSACTION NOTE (per the "single transaction if it fits cleanly"
   * requirement): this is deliberately called OUTSIDE the `$transaction`
   * block above, not nested inside it. StoryNavigationService's own
   * transition logic (unlock-rule evaluation, then StoryProgress +
   * SceneCompletion writes) opens its OWN `prisma.$transaction`
   * internally via `applyTransition` — and a `Prisma.TransactionClient`
   * has no `$transaction` method of its own (see lib/prisma.ts's
   * `DbClient` type), so it cannot be nested inside the `tx` above
   * without first refactoring StoryNavigationService's unlock-evaluation
   * and write path to accept an externally-supplied transaction client
   * throughout — a change with a blast radius well beyond this bug
   * (it would also touch UnlockService and SceneService call sites).
   * That refactor is a reasonable follow-up, not something I did
   * silently under a bug-fix diff.
   *
   * Instead, the required invariant ("successful first solve => solved
   * AND gate advanced") is upheld via idempotent retry, exactly as the
   * spec's DUPLICATE SOLVE section explicitly permits: ChallengeSolve
   * is already durably committed by the time this runs. If this step
   * fails or the process dies between the two transactions, the player
   * is left on the stale gate — but the very next correct submission
   * (including a harmless duplicate-solve resubmission, which this
   * method treats identically) re-reads current StoryProgress fresh and
   * completes the advance then. There is no path where this can
   * double-advance or advance the wrong gate, because the CHALLENGE_GATE
   * + challengeId check inside it fails closed the moment the gate has
   * already moved on.
   *
   * Never lets a story-navigation failure fail the submission response
   * itself — a player's correct flag and awarded XP must never be
   * rolled back or hidden behind an unrelated story-navigation error.
   */
  private async advanceStoryIfCurrentGate(
    userId: string,
    challengeId: string,
  ): Promise<void> {
    try {
      await storyNavigationService.advanceAfterChallengeSolved(
        userId,
        challengeId,
      );
    } catch (error) {
      log.error(
        "Story progression failed after a correct submission — solve is recorded, but StoryProgress may still point at the solved gate until the next successful submission retries it",
        error,
        { userId, challengeId },
      );
    }
  }

  /**
   * A player's full submission history, most recent first, mapped to the
   * client-safe DTO here (not in the action) — same pattern as
   * ChallengeService returning PublicChallenge rather than leaving the
   * mapping to the caller.
   */
  async getMySubmissions(userId: string): Promise<SubmissionDTO[]> {
    const submissions = await submissionRepository.findSubmissionsByUser(
      prisma,
      userId,
    );
    return toSubmissionDTOList(submissions);
  }

  private async assertEventIsLive(userId: string): Promise<void> {
    const access = await eventService.getEventAccess(prisma);

    if (!access.canAccessGame) {
      log.debug("Submission rejected — event not accessible", {
        userId,
        state: access.state,
        isPaused: access.isPaused,
      });

      const message = access.isPaused
        ? "The event is temporarily paused. Please try again shortly."
        : access.state === "EVENT_SOON"
          ? "The event hasn't started yet."
          : "The event has ended. Submissions are closed.";

      throw ApiError.forbidden(ErrorCode.FORBIDDEN, message);
    }
  }

  /**
   * Independently re-derives challenge access for THIS submission
   * request — never assumes the player legitimately reached this point
   * via the GET challenge page. HTTP requests are stateless and the GET
   * page load (or lack of one) proves nothing; a forged
   * `POST /challenges/C42/submit` with no prior GET must be rejected
   * exactly as if it had been a GET. Uses the same generic NOT_FOUND as
   * the GET path — a wrong flag against an unauthorized challenge and a
   * correct flag against an unauthorized challenge must be
   * indistinguishable to the caller.
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
      log.warn("Submission denied by ChallengeAccessService", {
        userId,
        challengeId,
        deniedReason: access.deniedReason,
      });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Challenge not found.");
    }
  }

  /**
   * Coarse per-user rate limit — protects against a script hammering the
   * submit endpoint exactly when a live event's time pressure makes a
   * player most tempted to spam-guess. Deliberately simple (a count over
   * a trailing window, not a token bucket) — 10–15 challenges and a
   * modest concurrent player count don't justify more machinery.
   */
  private async assertNotRateLimited(userId: string): Promise<void> {
    const since = new Date(
      Date.now() - SUBMISSION_CONSTANTS.RATE_LIMIT_WINDOW_MS,
    );
    const recentCount = await submissionRepository.countRecentSubmissions(
      prisma,
      userId,
      since,
    );

    if (recentCount >= SUBMISSION_CONSTANTS.MAX_SUBMISSIONS_PER_WINDOW) {
      log.warn("Submission rate limit exceeded", {
        userId,
        recentCount,
      });

      throw ApiError.tooManyRequests(
        ErrorCode.TOO_MANY_REQUESTS,
        "Too many submissions. Please wait a moment before trying again.",
      );
    }
  }

  private isDuplicateSolve(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
}

export const submissionService = new SubmissionService();
