"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { storyService } from "../services/story.service";
import type { ActionState } from "@/lib/action-state";
import type { StoryProgressDTO } from "../types/progress.dto";

/**
 * requireAuth() only, no schema, no client input — same shape as every
 * other self-scoped read in this module (getChapterMap, getCurrentScene)
 * and the modules before it (getMyRank, getMySubmissions).
 *
 * Goes through storyService, not storyNavigationService — this is
 * genuinely the "just tell me where I am" read
 * (storyService.getStoryProgress throws NOT_FOUND if no progress row
 * exists yet), not "give me a playable scene, bootstrapping one if
 * needed" the way getCurrentScene is. A player who's never started the
 * story gets a clear "not started" signal here rather than a
 * side-effecting row creation triggered by what looks like a read — the
 * distinction storyService.getStoryProgress's own doc comment already
 * draws.
 */
export async function getStoryProgress(): Promise<ActionState<StoryProgressDTO>> {
  try {
    const user = await requireAuth();
    const progress = await storyService.getStoryProgress(user.userId);

    return {
      success: true,
      message: "Story progress fetched successfully.",
      data: progress,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[getStoryProgress] unexpected error:", error);
    return { success: false, message: "Failed to fetch story progress." };
  }
}