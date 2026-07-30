"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { storyService } from "../services/story.service";
import { restartStorySchema } from "../validations/restart-story.schema";
import type { ActionState } from "@/lib/action-state";
import type { StoryStateDTO } from "../types/story.dto";

/**
 * `confirm: true` is required input, not optional — matching
 * restart-story.schema.ts's own reasoning: this destroys
 * SceneCompletion/ChoiceSelection/StoryProgress with no undo path, so
 * the request itself must carry unambiguous intent, not just a bare
 * call a stray double-click could trigger.
 *
 * No rate limit here, deliberately, unlike advance-scene/select-choice.
 * Those two get rate-limited because they're the high-frequency,
 * "everyone acts near the same moment" write path every player hits
 * constantly through the event. A restart is rare, destructive, and
 * self-directed — the risk profile a rate limiter exists for (volume
 * abuse) doesn't apply the same way to an action a player would only
 * ever call a handful of times, deliberately, against their own data.
 *
 * Returns the freshly-bootstrapped StoryStateDTO directly — the same
 * shape getCurrentScene returns — so a client calling this can render
 * the new first scene immediately without a second round-trip.
 */
export async function restartStory(confirm: boolean): Promise<ActionState<StoryStateDTO>> {
  try {
    const user = await requireAuth();

    const parsed = restartStorySchema.safeParse({ confirm });

    if (!parsed.success) {
      return {
        success: false,
        message: "You must confirm this action before restarting your progress.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const state = await storyService.restartStory(user.userId);

    return { success: true, message: "Story restarted.", data: state };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[restartStory] unexpected error:", error);
    return { success: false, message: "Failed to restart your story progress." };
  }
}