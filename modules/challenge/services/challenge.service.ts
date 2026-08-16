// modules/challenge/services/challenge.service.ts (only getChallengeForPlayer changes)
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import { challengeRepository } from "../repositories/challenge.repository";
import {
  toPlayerChallengeDTO,
  toPublicChallenge,
  toPublicChallengeList,
} from "../utils/challenge.mapper";
import { challengeLogger as log } from "@/lib/logger/logger.scopes";
import { challengeAccessService } from "./challenge-access.service";
import { PlayerChallengeDTO } from "../types/challenge.types";

class ChallengeService {
  async getChallenges() {
    const challenges = await challengeRepository.findAll();
    return toPublicChallengeList(challenges);
  }

  async getChallengeById(id: string) {
    const challenge = await challengeRepository.findById(id);

    if (!challenge) {
      log.warn("Challenge lookup by id missed", { id });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Challenge not found.");
    }

    return toPublicChallenge(challenge);
  }

  async getChallengeBySlug(slug: string) {
    const challenge = await challengeRepository.findBySlug(slug);

    if (!challenge) {
      log.warn("Challenge lookup by slug missed", { slug });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Challenge not found.");
    }

    return toPublicChallenge(challenge);
  }

  /**
   * The player-facing challenge GET path — now id-based, not slug-based.
   *
   * CHANGED from slug to id: everything that actually navigates here
   * (ChallengeGate, reading Scene.challengeId — a raw Challenge.id FK)
   * has only ever had an id available, never a slug. ChallengeAccessService,
   * the attachment route, and submitFlagSchema already all operate on
   * challengeId for the same reason. Slug lookup (getChallengeBySlug)
   * stays available above for any non-player-gated caller that still
   * needs it — this method alone switches basis.
   *
   * Same fail-closed contract as before: a challenge that exists but
   * isn't currently authorized for this player returns the exact same
   * NOT_FOUND as a challenge that doesn't exist at all.
   */
  async getChallengeForPlayer(
    userId: string,
    challengeId: string,
  ): Promise<PlayerChallengeDTO> {
    const challenge = await challengeRepository.findById(challengeId);

    if (!challenge) {
      log.warn("Player challenge lookup missed — no such challenge", {
        userId,
        challengeId,
      });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Challenge not found.");
    }

    const access = await challengeAccessService.evaluateChallengeAccess(
      userId,
      challenge.id,
    );

    if (!access.isAuthorized) {
      log.warn("Player challenge lookup denied by ChallengeAccessService", {
        userId,
        challengeId: challenge.id,
        deniedReason: access.deniedReason,
      });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Challenge not found.");
    }

    return toPlayerChallengeDTO(challenge);
  }

  async getChallengesByChapter(chapterId: string) {
    const challeges = await challengeRepository.findByChapter(chapterId);
    return toPublicChallengeList(challeges);
  }
}

export const challengeService = new ChallengeService();