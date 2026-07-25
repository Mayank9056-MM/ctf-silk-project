import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import { flagService } from "./flag.service";
import { eventService } from "@/modules/event/services/event.service";
import prisma from "@/lib/prisma";
import { challengeRepository } from "../repositories/challenge.repository";

class ChallengeService {
  /**
   * Returns all chalenges.
   */
  async getChallenges() {
    return challengeRepository.findAll();
  }

  /**
   * Returns a challenge by its id.
   */
  async getChallengeById(id: string) {
    const challenge = await challengeRepository.findById(id);

    if (!challenge) {
      throw new ApiError(404, ErrorCode.NOT_FOUND, "Challenge not found.");
    }

    return challenge;
  }

  /**
   * Returns a challenge by its slug.
   */
  async getChallengeBySlug(slug: string) {
    const challenge = await challengeRepository.findBySlug(slug);

    if (!challenge) {
      throw new ApiError(404, ErrorCode.NOT_FOUND, "Challenge not found.");
    }

    return challenge;
  }

  /**
   * Returns all chalenges in a chapter.
   */
  async getChallengesByChapter(chapter: number) {
    return challengeRepository.findByChapter(chapter);
  }

  /**
   * Verifies a submitted flag.
   *
   * NOTE:
   * This service only verifies the flag.
   * Recording submissions belongs to the submissions module.
   */
  async verifyFlag(challengeId: string, submittedFlag: string) {
    const access = await eventService.getEventAccess(prisma);

    if (!access.canAccessGame) {
      throw ApiError.forbidden(
        ErrorCode.FORBIDDEN,
        access.state === "EVENT_SOON"
          ? "The event hasn't started yet."
          : "The event has ended. Submissions are closed.",
      );
    }

    const challenge =
      await challengeRepository.getFlagVerificationData(challengeId);

    if (!challenge) {
      throw new ApiError(404, ErrorCode.NOT_FOUND, "Challenge not found.");
    }

    const isCorrect = await flagService.verify(
      submittedFlag,
      challenge.flagHash,
    );

    return {
      isCorrect,
      xpAwarded: isCorrect ? challenge.xpReward : 0,
      message: isCorrect ? "Correct flag!" : "Incorrect flag.",
    };
  }
}

export const challengeService = new ChallengeService();
