"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { RATE_LIMITS } from "@/lib/rate-limit/rate-limit.constants";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import { storyNavigationService } from "../services/story-navigation.service";
import { selectChoiceSchema } from "../validations/select-choice.schema";
import type { ActionState } from "@/lib/action-state";
import type { StoryStateDTO } from "../types/story.dto";

/**
 * Mirrors advance-scene.ts exactly — same global rate limit before auth,
 * same identity-from-session discipline. The only real difference is a
 * second client-supplied field (choiceId), and per select-choice.schema.ts's
 * own comment, this schema only validates that both IDs are well-formed —
 * whether choiceId actually belongs to currentSceneId is verified inside
 * storyNavigationService.selectChoice against the real database
 * relationship, not assumed here.
 */
export async function selectChoice(
  currentSceneId: string,
  choiceId: string,
): Promise<ActionState<StoryStateDTO>> {
  try {
    const globalLimit = await checkRateLimit({
      action: "story:select-choice",
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

    const parsed = selectChoiceSchema.safeParse({ currentSceneId, choiceId });

    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid request.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const state = await storyNavigationService.selectChoice(
      user.userId,
      parsed.data.currentSceneId,
      parsed.data.choiceId,
    );

    return { success: true, message: "Choice recorded.", data: state };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[selectChoice] unexpected error:", error);
    return { success: false, message: "Failed to record your choice." };
  }
}