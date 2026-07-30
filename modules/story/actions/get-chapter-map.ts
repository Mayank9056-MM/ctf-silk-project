"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { storyService } from "../services/story.service";
import type { ActionState } from "@/lib/action-state";
import type { ChapterMapDTO } from "../types/chapter.dto";

/**
 * requireAuth() rather than requirePermission() — same reasoning as
 * getLeaderboard/getMySubmissions: viewing the campaign map is a
 * baseline capability of being signed in, not a distinct permission. No
 * schema, no client input at all — storyService.getChapterMap resolves
 * everything (chapters, current position, unlock status) from the
 * caller's own verified session, the same argument-less shape as
 * getMyRank/getMySubmissions.
 *
 * No rate limit here, matching every other read-only action in this
 * build (getLeaderboard, getChallenges) — the campaign map is cached at
 * the service layer (storyCache, ~60s TTL on published chapters) and
 * read-only besides, so it carries none of the abuse risk that justified
 * rate-limiting login/register/submit-flag/scene-advance.
 */
export async function getChapterMap(): Promise<ActionState<ChapterMapDTO>> {
  try {
    const user = await requireAuth();
    const map = await storyService.getChapterMap(user.userId);

    return {
      success: true,
      message: "Chapter map fetched successfully.",
      data: map,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[getChapterMap] unexpected error:", error);
    return { success: false, message: "Failed to fetch chapter map." };
  }
}