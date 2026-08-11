// modules/story/actions/get-evidence-board.ts
"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { evidenceService } from "../services/evidence.service";
import type { ActionState } from "@/lib/action-state";
import type { EvidenceBoardDTO } from "../types/evidence.dto";

/**
 * requireAuth() only, no schema, no client input — same shape as
 * getChapterMap/getCurrentScene/getStoryProgress. The board is entirely
 * derived from the caller's own session (current chapter + progress),
 * never a client-supplied chapter or userId.
 *
 * No rate limit — read-only, matching every other read action in this
 * module.
 */
export async function getEvidenceBoard(): Promise<ActionState<EvidenceBoardDTO>> {
  try {
    const user = await requireAuth();
    const board = await evidenceService.getEvidenceBoard(user.userId);

    return {
      success: true,
      message: "Evidence board fetched successfully.",
      data: board,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[getEvidenceBoard] unexpected error:", error);
    return { success: false, message: "Failed to fetch evidence board." };
  }
}