"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { storyService } from "../services/story.service";
import { replaySceneSchema } from "../validations/replay-scene.schema";
import type { ActionState } from "@/lib/action-state";
import type { SceneDTO } from "../types/scene.dto";

/**
 * requireAuth() only — replaying content a player has legitimately
 * already completed carries no fairness/scoring consequence, matching
 * storyService.replayScene's own reasoning for not gating on event-live
 * either. The real access control here is entirely inside
 * sceneService.getSceneForReplay: it checks SceneCompletion directly and
 * returns NOT_FOUND for a scene that either doesn't exist or was never
 * completed by this player — this action has no additional gate to add
 * on top of that.
 *
 * No rate limit — a player re-reading a scene they've already seen is a
 * read, not a write, and carries none of the abuse profile that
 * justified limiting login/register/submit-flag/scene-advance.
 */
export async function replayScene(
  sceneId: string,
): Promise<ActionState<SceneDTO>> {
  try {
    const user = await requireAuth();

    const parsed = replaySceneSchema.safeParse({ sceneId });

    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid request.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const scene = await storyService.replayScene(
      user.userId,
      parsed.data.sceneId,
    );

    return {
      success: true,
      message: "Scene fetched successfully.",
      data: scene,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[replayScene] unexpected error:", error);
    return { success: false, message: "Failed to fetch scene." };
  }
}
