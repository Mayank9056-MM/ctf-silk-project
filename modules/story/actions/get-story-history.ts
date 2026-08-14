"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { storyService } from "../services/story.service";
import type { ActionState } from "@/lib/action-state";
import type { StoryHistoryDTO } from "../types/progress.dto";

/**
 * requireAuth() only, no schema — identical shape to getStoryProgress.
 * No rate limit — read-only, same profile as every other read action in
 * this module.
 */
export async function getStoryHistory(): Promise<ActionState<StoryHistoryDTO>> {
  try {
    const user = await requireAuth();
    const history = await storyService.getStoryHistory(user.userId);

    return {
      success: true,
      message: "Story history fetched successfully.",
      data: history,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[getStoryHistory] unexpected error:", error);
    return { success: false, message: "Failed to fetch story history." };
  }
}