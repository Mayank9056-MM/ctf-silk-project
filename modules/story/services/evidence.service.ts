import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import prisma from "@/lib/prisma";

import { storyContentRepository } from "../repositories/story-content.repository";
import { storyCache, storyCacheKeys } from "../utils/story-cache";
import {
  toEvidenceDTO,
  toEvidenceDTOList,
  toEvidencePreviewDTO,
  toAdminEvidenceDTO,
} from "../utils/evidence.mapper";
import type {
  EvidenceDTO,
  EvidenceBoardDTO,
  EvidencePreviewDTO,
  AdminEvidenceDTO,
} from "../types/evidence.dto";
import { STORY_CONSTANTS } from "../constants/story.constants";

/**
 * Owns Evidence content — the investigation board. Same scope discipline
 * as dialogue.service.ts: this answers "what is this evidence," never
 * "should this player be able to see it" — unlock-rule evaluation
 * belongs to whichever service orchestrates the board view, not
 * duplicated here.
 *
 * Unlike DialogueService, this one DOES use storyCache directly — full
 * evidence detail (getEvidence) is meaningfully likely to be requested
 * standalone (a player clicking into one board item, not always as part
 * of a composed scene response the way dialogue always is), so caching
 * it here, not just at a higher orchestration layer, avoids a real
 * repeated-request cost during a live event.
 */
class EvidenceService {
  /** One piece of evidence, player-facing — only if it's actually published. */
  async getEvidence(evidenceId: string): Promise<EvidenceDTO> {
    const evidence = await storyCache.getOrSet(
      storyCacheKeys.publishedEvidence(evidenceId),
      () => storyContentRepository.findPublishedEvidence(prisma, evidenceId),
      STORY_CONSTANTS.EVIDENCE_CACHE_TTL_MS,
    );

    if (!evidence) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Evidence not found.");
    }

    return toEvidenceDTO(evidence);
  }

  /**
   * The lighter preview shape for embedding inside a scene response
   * (EVIDENCE_REVEAL scenes) — reuses the same cached lookup as
   * getEvidence rather than a separate cache entry, since it's the exact
   * same underlying row, just mapped differently at the edge.
   */
  async getEvidencePreview(
    evidenceId: string,
  ): Promise<EvidencePreviewDTO | null> {
    const evidence = await storyCache.getOrSet(
      storyCacheKeys.publishedEvidence(evidenceId),
      () => storyContentRepository.findPublishedEvidence(prisma, evidenceId),
      STORY_CONSTANTS.EVIDENCE_CACHE_TTL_MS,
    );

    return evidence ? toEvidencePreviewDTO(evidence) : null;
  }

  /**
   * The full board for a player. NOT filtered to "evidence this specific
   * player has unlocked" here — that filtering is a
   * story-navigation.service.ts concern (it needs SceneCompletion data
   * this service has no business reading), so this method's real name is
   * closer to "every published evidence item, unfiltered by player
   * progress." The board action calling this must apply its own
   * per-player filter before returning to the client, or every player
   * would see the entire investigation spoiled on day one.
   */
  async getEvidenceBoard(): Promise<EvidenceBoardDTO> {
    // Deliberately NOT cached under a single "board" key — evidence
    // items publish independently over the course of authoring, and a
    // findMany with no natural per-item cache boundary would mean any
    // one evidence change invalidates the whole board anyway. Simpler to
    // let this one query hit Postgres directly; it's a single indexed
    // scan over a small table, not worth the cache-invalidation
    // complexity for the marginal cost saved.
    const items = await prisma.evidence.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "asc" },
    });

    return { items: toEvidenceDTOList(items) };
  }

  /**
   * Admin-only — full authoring fidelity, any status. Permission
   * enforcement happens at the action layer, not here.
   */
  async getAdminEvidence(evidenceId: string): Promise<AdminEvidenceDTO> {
    const evidence = await storyContentRepository.findEvidence(
      prisma,
      evidenceId,
    );

    if (!evidence) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Evidence not found.");
    }

    return toAdminEvidenceDTO(evidence);
  }
}

export const evidenceService = new EvidenceService();
