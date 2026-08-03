import { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import { eventService } from "@/modules/event/services/event.service";
import { challengeRepository } from "@/modules/challenge/repositories/challenge.repository";
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
 * logic.
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
   *   3. Verify the flag OUTSIDE the transaction — a pure read plus
   *      comparison, no reason to hold a DB transaction open for it.
   *      Reading challenge data outside the transaction is safe here
   *      because xpReward/flagHash are script-authored and static for
   *      the whole event — nothing else can change them mid-request.
   *   4. Record the attempt, and (if correct) the solve, INSIDE one
   *      transaction — the P2002 catch below is what actually enforces
   *      "first correct solve only," not a prior SELECT.
   */
  async submitFlag(
    userId: string,
    input: SubmitFlagInput,
  ): Promise<SubmitFlagOutcome> {
    await this.assertEventIsLive(userId);
    await this.assertNotRateLimited(userId);

    const challenge = await challengeRepository.getFlagVerificationData(
      input.challengeId,
    );

    if (!challenge) {
      log.warn("Submission attempted for unknown challenge", {
        userId,
        challengeId: input.challengeId,
      });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Challenge not found.");
    }

    const isCorrect = await flagService.verify(input.flag, challenge.flagHash);
    const submittedFlagHash = isCorrect ? await hashFlag(input.flag) : null;

    try {
      return prisma.$transaction(async (tx) => {
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
            // Composite PK collision on (userId, challengeId) — already
            // solved via a prior submission. This attempt is still logged
            // above; no additional XP.
            return { isCorrect: true, xpAwarded: 0, alreadySolved: true };
          }
          throw error;
        }
      });
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
      log.debug("Submission rejected — event not live", {
        userId,
        state: access.state,
      });

      throw ApiError.forbidden(
        ErrorCode.FORBIDDEN,
        access.state === "EVENT_SOON"
          ? "The event hasn't started yet."
          : "The event has ended. Submissions are closed.",
      );
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
