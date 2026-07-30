import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import prisma from "@/lib/prisma";
import { ContentStatus } from "@/app/generated/prisma/enums";

import { storyContentRepository } from "../repositories/story-content.repository";
import { storyProgressRepository } from "../repositories/story-progress.repository";
import { evidenceService } from "./evidence.service";
import { toSceneDTO } from "../utils/scene.mapper";
import type { ResolvedScene } from "../types/scene.types";
import type { SceneDTO } from "../types/scene.dto";

/**
 * Assembles a single scene's full player-facing response — dialogue,
 * choices, evidence preview, completion status — from a sceneId the
 * CALLER has already determined is appropriate to render. This service
 * does not decide WHICH scene a player should be on (that's
 * story-navigation.service.ts, via scene-resolver.ts) and does not
 * evaluate UnlockRules (unlock.service.ts) — it answers "render this
 * scene," never "should this player be looking at it," with one narrow
 * exception below where that distinction collapses into the same thing.
 */
class SceneService {
  /**
   * Player-facing scene render. Requires PUBLISHED — an admin's draft
   * content reaching this path would be a real bug, never something to
   * silently tolerate.
   */
  async getScene(userId: string, sceneId: string): Promise<SceneDTO> {
    const resolved = await this.resolveSceneContent(sceneId, {
      requirePublished: true,
    });
    return this.assembleDTO(userId, resolved);
  }

  /**
   * Serves a scene ONLY if the player has already completed it — the gate
   * that makes "replay" different from "peek ahead at unreached content."
   * Deliberately checks completion before touching scene content at all,
   * and returns the identical NOT_FOUND shape whether the scene doesn't
   * exist or simply isn't completed yet — no response-shape or timing
   * difference a player could use to enumerate the story graph ahead of
   * actually reaching it.
   */
  async getSceneForReplay(userId: string, sceneId: string): Promise<SceneDTO> {
    const hasCompleted = await storyProgressRepository.hasCompletedScene(
      prisma,
      userId,
      sceneId,
    );

    if (!hasCompleted) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Scene not found.");
    }

    // requirePublished: false — completion already proves this scene was
    // published at some point; a scene should never become un-viewable
    // to a player who already has legitimate history with it, even if
    // it's later archived.
    const resolved = await this.resolveSceneContent(sceneId, {
      requirePublished: false,
    });
    return this.assembleDTO(userId, resolved, { isCompleted: true });
  }

  /**
   * Fetches dialogue and choices in parallel — a single round trip pair,
   * not three sequential queries. Existence/status checks read off the
   * already-fetched scene object (findSceneWithDialogue returns every
   * scalar field, `status` included) rather than a separate lookup
   * purely to check it exists.
   */
  private async resolveSceneContent(
    sceneId: string,
    options: { requirePublished: boolean },
  ): Promise<ResolvedScene> {
    const [scene, choices] = await Promise.all([
      storyContentRepository.findSceneWithDialogue(prisma, sceneId),
      storyContentRepository.findSceneChoices(prisma, sceneId),
    ]);

    if (!scene) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Scene not found.");
    }

    if (options.requirePublished && scene.status !== ContentStatus.PUBLISHED) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Scene not found.");
    }

    return { scene, choices };
  }

  /**
   * Completion status and evidence preview resolve in parallel too —
   * independent lookups with no reason to serialize. `overrides.isCompleted`
   * lets getSceneForReplay skip a redundant second completion check,
   * since it already confirmed completion before calling this.
   */
  private async assembleDTO(
    userId: string,
    resolved: ResolvedScene,
    overrides: { isCompleted?: boolean } = {},
  ): Promise<SceneDTO> {
    const { scene } = resolved;

    const [isCompleted, evidencePreview] = await Promise.all([
      overrides.isCompleted !== undefined
        ? Promise.resolve(overrides.isCompleted)
        : storyProgressRepository.hasCompletedScene(prisma, userId, scene.id),
      scene.evidenceId
        ? evidenceService.getEvidencePreview(scene.evidenceId)
        : Promise.resolve(null),
    ]);

    return toSceneDTO(resolved, { isCompleted, evidence: evidencePreview });
  }
}

export const sceneService = new SceneService();
