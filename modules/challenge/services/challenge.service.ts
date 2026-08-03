import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import { challengeRepository } from "../repositories/challenge.repository";
import {
  toPublicChallenge,
  toPublicChallengeList,
} from "../utils/challenge.mapper";
import { challengeLogger as log } from "@/lib/logger/logger.scopes";

class ChallengeService {
  /**
   * Returns all chalenges.
   */
  async getChallenges() {
    const challenges = await challengeRepository.findAll();
    return toPublicChallengeList(challenges);
  }

  /**
   * Returns a challenge by its id.
   */
  async getChallengeById(id: string) {
    const challenge = await challengeRepository.findById(id);

    if (!challenge) {
      log.warn("Challenge lookup by id missed", { id });
      throw new ApiError(404, ErrorCode.NOT_FOUND, "Challenge not found.");
    }

    return toPublicChallenge(challenge);
  }

  /**
   * Returns a challenge by its slug.
   */
  async getChallengeBySlug(slug: string) {
    const challenge = await challengeRepository.findBySlug(slug);

    if (!challenge) {
      log.warn("Challenge lookup by slug missed", { slug });
      throw new ApiError(404, ErrorCode.NOT_FOUND, "Challenge not found.");
    }

    return toPublicChallenge(challenge);
  }

  /**
   * Returns all chalenges in a chapter.
   */
  async getChallengesByChapter(chapterId: string) {
    const challeges = await challengeRepository.findByChapter(chapterId);
    return toPublicChallengeList(challeges);
  }
}

export const challengeService = new ChallengeService();
