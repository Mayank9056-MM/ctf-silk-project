"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { storyNavigationService } from "../services/story-navigation.service";
import type { ActionState } from "@/lib/action-state";
import type { StoryStateDTO } from "../types/story.dto";

/**
 * requireAuth() rather than requirePermission() — same reasoning as
 * getChapterMap: this is a baseline read for any signed-in player, not a
 * distinct permission. No schema, no client input — the caller's own
 * session is the only thing this needs, and it's what bootstraps a
 * fresh StoryProgress row on a player's very first request (see
 * storyNavigationService.getOrCreateProgress).
 *
 * Unlike getChapterMap, this one goes through storyNavigationService,
 * not storyService — it's asking "what should I be looking at right
 * now" (moment-to-moment position), not "show me the whole campaign
 * map." Same module, deliberately different entry point, matching the
 * split those two services were built around.
 *
 * No rate limit — this is the action a client calls simply by loading
 * the story page; it's read-only (event-live gating happens inside the
 * service, but nothing here writes state on a bare "what scene am I on"
 * request beyond the one-time progress-row bootstrap, which the
 * composite... actually StoryProgress's userId-as-PK already makes that
 * bootstrap idempotent on its own, so even a retried request can't
 * duplicate it).
 */
export async function getCurrentScene(): Promise<ActionState<StoryStateDTO>> {
  try {
    const user = await requireAuth();
    const state = await storyNavigationService.getCurrentScene(user.userId);

    return {
      success: true,
      message: "Current scene fetched successfully.",
      data: state,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[getCurrentScene] unexpected error:", error);
    return { success: false, message: "Failed to fetch current scene." };
  }
}