import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import prisma from "@/lib/prisma";

import { storyContentRepository } from "../repositories/story-content.repository";
import {
  toDialogueSequenceDTO,
  toAdminDialogueLineDTOList,
} from "../utils/dialogue.mapper";
import type { DialogueSequenceDTO } from "../types/dialogue.dto";
import type { AdminDialogueLineDTO } from "../types/dialogue.dto";

import { storyLogger as log } from "@/lib/logger/logger.scopes";

/**
 * Owns dialogue content for a scene. Deliberately does NOT check event
 * access, scene publish status, or unlock rules — those apply equally
 * to a scene's dialogue, choices, and evidence alike, and belong to
 * whichever service orchestrates a full scene response (scene.service.ts /
 * story-navigation.service.ts), not duplicated into every per-concern
 * service that composes into it. This service answers "what is this
 * scene's dialogue," never "should this player be seeing it."
 */
class DialogueService {
  /**
   * A scene's full dialogue sequence, player-facing. Throws NOT_FOUND if
   * the scene itself doesn't exist — callers that already resolved the
   * scene (and so already know it exists) still get a defensive check
   * here rather than an unhandled null downstream.
   */
  async getDialogueSequence(sceneId: string): Promise<DialogueSequenceDTO> {
    const scene = await storyContentRepository.findSceneWithDialogue(
      prisma,
      sceneId,
    );

    if (!scene) {
      log.warn("Dialogue sequence requested for missing scene", { sceneId });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Scene not found.");
    }

    return toDialogueSequenceDTO(scene);
  }

  /**
   * Admin-only — full authoring fidelity (line ids, raw characterId).
   * Permission enforcement (requirePermission(MANAGE_STORY)) happens at
   * the action layer calling this, not here — same division of
   * responsibility as every other module in this build.
   */
  async getAdminDialogueLines(
    sceneId: string,
  ): Promise<AdminDialogueLineDTO[]> {
    const scene = await storyContentRepository.findSceneWithDialogue(
      prisma,
      sceneId,
    );

    if (!scene) {
      log.warn("Admin dialogue lookup requested for missing scene", {
        sceneId,
      });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Scene not found.");
    }

    return toAdminDialogueLineDTOList(scene.dialogueLines);
  }

  /**
   * A single dialogue line by id — composed by filtering an already-
   * fetched scene's lines, since story-content.repository.ts has no
   * per-line lookup today (only scene-scoped reads; see the note below).
   * If this becomes a hot path (a CMS single-line editor making frequent
   * standalone requests), a dedicated `findDialogueLineById` repository
   * method would be worth adding rather than continuing to over-fetch
   * the whole scene for one line.
   */
  async getDialogueLine(
    sceneId: string,
    dialogueLineId: string,
  ): Promise<AdminDialogueLineDTO> {
    const lines = await this.getAdminDialogueLines(sceneId);
    const line = lines.find((candidate) => candidate.id === dialogueLineId);

    if (!line) {
      log.warn("Dialogue line not found in scene", {
        sceneId,
        dialogueLineId,
      });
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Dialogue line not found.");
    }

    return line;
  }
}

export const dialogueService = new DialogueService();
