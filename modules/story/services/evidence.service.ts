import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import prisma from "@/lib/prisma";

import { storyContentRepository } from "../repositories/story-content.repository";
import { storyProgressRepository } from "../repositories/story-progress.repository";
import { storyCache, storyCacheKeys } from "../cache/story.cache";
import { unlockService } from "./unlock.service";
import {
  toEvidenceDTO,
  toEvidencePreviewDTO,
  toAdminEvidenceDTO,
  toUnlockedEvidenceBoardItemDTO,
  toLockedEvidenceBoardItemDTO,
} from "../utils/evidence.mapper";
import { toChapterDTO } from "../utils/story.mapper";
import { EvidenceAccessState } from "../types/evidence.dto";
import type {
  EvidenceDTO,
  EvidenceBoardDTO,
  EvidenceBoardItemDTO,
  EvidencePreviewDTO,
  AdminEvidenceDTO,
} from "../types/evidence.dto";
import { STORY_CONSTANTS } from "../constants/story.constants";

import { storyLogger as log } from "@/lib/logger/logger.scopes";

class EvidenceService {
  /**
   * One piece of evidence, player-facing. Requires the SAME safe
   * not-found semantics whether the id doesn't exist OR it exists but
   * isn't unlocked for this player — a locked id must be
   * indistinguishable from an unknown one, or a player can enumerate
   * valid ids just by noticing a different response.
   */
  async getEvidence(userId: string, evidenceId: string): Promise<EvidenceDTO> {
    const evidence = await storyCache.getOrSet(
      storyCacheKeys.publishedEvidence(evidenceId),
      () => storyContentRepository.findPublishedEvidence(prisma, evidenceId),
      STORY_CONSTANTS.EVIDENCE_CACHE_TTL_MS,
    );

    if (!evidence) {
      log.warn("Evidence lookup missed", { evidenceId });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Evidence not found.");
    }

    const unlock = await unlockService.evaluateEvidenceUnlock(
      userId,
      evidence.id,
    );
    if (!unlock.isUnlocked) {
      log.debug("Evidence access denied — not unlocked for player", {
        userId,
        evidenceId,
      });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Evidence not found.");
    }

    return toEvidenceDTO(evidence);
  }

  /** Unchanged — scene-embedded preview is already implicitly gated because
   *  a SceneDTO is never returned for a scene the player hasn't unlocked
   *  (see story-navigation.service.ts's applyTransition / sceneService's
   *  getScene / getSceneForReplay). No new access check needed here. */
  async getEvidencePreview(
    evidenceId: string,
  ): Promise<EvidencePreviewDTO | null> {
    const evidence = await storyCache.getOrSet(
      storyCacheKeys.publishedEvidence(evidenceId),
      () => storyContentRepository.findPublishedEvidence(prisma, evidenceId),
      STORY_CONSTANTS.EVIDENCE_CACHE_TTL_MS,
    );
    if (!evidence) {
      log.warn("Scene's declared evidence reference resolved to nothing", {
        evidenceId,
      });
      return null;
    }
    return toEvidencePreviewDTO(evidence);
  }

  /**
   * The player's board — scoped to their CURRENT chapter (Evidence has
   * no chapterId of its own; the association is derived transitively
   * through whichever EVIDENCE_REVEAL scene(s) reveal it). Batched
   * end-to-end: fixed number of queries regardless of how many evidence
   * items the chapter has, never one query per item.
   */
  async getEvidenceBoard(userId: string): Promise<EvidenceBoardDTO> {
    const progress = await storyProgressRepository.findProgress(prisma, userId);
    if (!progress || !progress.currentChapterId) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Story progress not found.");
    }

    const chapter = await storyContentRepository.findChapterById(
      prisma,
      progress.currentChapterId,
    );
    if (!chapter) {
      log.error("Chapter referenced by progress no longer exists", undefined, {
        userId,
        chapterId: progress.currentChapterId,
      });
      throw ApiError.internal(
        "Story progress references a chapter that no longer exists.",
      );
    }

    const revealScenes =
      await storyContentRepository.findEvidenceRevealScenesForChapter(
        prisma,
        chapter.id,
      );
    if (revealScenes.length === 0) {
      // A legitimate state — the Prologue and any chapter authored
      // without an investigation layer yet simply has an empty board.
      return { chapter: toChapterDTO(chapter), items: [] };
    }

    const evidenceIds = [...new Set(revealScenes.map((s) => s.evidenceId))];

    const [evidenceRows, unlockResults, completedScenes] = await Promise.all([
      storyContentRepository.findPublishedEvidenceByIds(prisma, evidenceIds),
      unlockService.evaluateEvidenceAccessForChapter(userId, evidenceIds),
      storyProgressRepository.getCompletedScenes(prisma, userId),
    ]);

    const evidenceById = new Map(evidenceRows.map((e) => [e.id, e]));
    const completedSceneIdSet = new Set(completedScenes.map((c) => c.sceneId));

    const revealSceneIdsByEvidence = new Map<string, string[]>();
    for (const scene of revealScenes) {
      const list = revealSceneIdsByEvidence.get(scene.evidenceId) ?? [];
      list.push(scene.id);
      revealSceneIdsByEvidence.set(scene.evidenceId, list);
    }

    const items: EvidenceBoardItemDTO[] = evidenceIds.map((evidenceId) => {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) {
        // A published EVIDENCE_REVEAL scene points at evidence that's
        // missing or unpublished — an authoring-integrity problem.
        // Fail closed; never surface it any differently than LOCKED.
        log.warn(
          "Evidence reveal scene references unpublished/missing evidence",
          {
            evidenceId,
            chapterId: chapter.id,
          },
        );
        return toLockedEvidenceBoardItemDTO(evidenceId);
      }

      const unlock = unlockResults.get(evidenceId) ?? {
        isUnlocked: true,
        unmetRuleIds: [],
      };
      if (!unlock.isUnlocked) {
        return toLockedEvidenceBoardItemDTO(evidence.id);
      }

      const revealSceneIds = revealSceneIdsByEvidence.get(evidenceId) ?? [];
      const discovered = revealSceneIds.some(
        (sceneId) =>
          completedSceneIdSet.has(sceneId) ||
          sceneId === progress.currentSceneId,
      );

      return toUnlockedEvidenceBoardItemDTO(
        evidence,
        discovered
          ? EvidenceAccessState.DISCOVERED
          : EvidenceAccessState.AVAILABLE,
      );
    });

    return { chapter: toChapterDTO(chapter), items };
  }

  /** Admin-only — unchanged. */
  async getAdminEvidence(evidenceId: string): Promise<AdminEvidenceDTO> {
    const evidence = await storyContentRepository.findEvidence(
      prisma,
      evidenceId,
    );
    if (!evidence) {
      log.warn("Admin evidence lookup missed", { evidenceId });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Evidence not found.");
    }
    return toAdminEvidenceDTO(evidence);
  }
}

export const evidenceService = new EvidenceService();
