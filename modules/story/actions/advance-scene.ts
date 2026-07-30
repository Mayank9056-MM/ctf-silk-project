"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { RATE_LIMITS } from "@/lib/rate-limit/rate-limit.constants";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import { storyNavigationService } from "../services/story-navigation.service";
import { advanceSceneSchema } from "../validations/advance-scene.schema";
import type { ActionState } from "@/lib/action-state";
import type { StoryStateDTO } from "../types/story.dto";

/**
 * Identity comes from requireAuth()'s verified session — never a
 * client-supplied userId. currentSceneId is the only client input, and
 * it's checked by storyNavigationService.requireCurrentScene against
 * this specific player's real progress row before anything advances;
 * there is no path here for one player's request to move another
 * player's story forward.
 *
 * A global rate-limit check runs before auth, same ordering as
 * submit-flag.ts — cheapest possible rejection first, given scene
 * transitions during a live event share the same "everyone acts near
 * the same moment" traffic shape as flag submissions (a cutscene ending
 * for many players around the same time, not evenly spread).
 */
export async function advanceScene(
  currentSceneId: string,
): Promise<ActionState<StoryStateDTO>> {
  try {
    const globalLimit = await checkRateLimit({
      action: "story:advance-scene",
      identifier: "global",
      ...RATE_LIMITS.SUBMIT_FLAG_GLOBAL,
    });

    if (!globalLimit.allowed) {
      throw ApiError.tooManyRequests(
        ErrorCode.TOO_MANY_REQUESTS,
        "Too many requests system-wide. Please try again in a moment.",
      );
    }

    const user = await requireAuth();

    const parsed = advanceSceneSchema.safeParse({ currentSceneId });

    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid request.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const state = await storyNavigationService.advanceScene(
      user.userId,
      parsed.data.currentSceneId,
    );

    return { success: true, message: "Advanced.", data: state };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[advanceScene] unexpected error:", error);
    return { success: false, message: "Failed to advance the story." };
  }
}
