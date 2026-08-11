// modules/story/actions/get-evidence.ts
"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { evidenceService } from "../services/evidence.service";
import { getEvidenceSchema } from "../validations/get-evidence.schema";
import type { ActionState } from "@/lib/action-state";
import type { EvidenceDTO } from "../types/evidence.dto";

/**
 * requireAuth() only — the real access control is entirely inside
 * evidenceService.getEvidence: it checks unlockService against this
 * specific player's progress and returns the identical NOT_FOUND
 * whether the id is unknown or simply locked. No rate limit — opening a
 * piece of evidence a player is allowed to see is a read, same profile
 * as replayScene.
 */
export async function getEvidence(
  evidenceId: string,
): Promise<ActionState<EvidenceDTO>> {
  try {
    const user = await requireAuth();

    const parsed = getEvidenceSchema.safeParse({ evidenceId });

    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid request.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const evidence = await evidenceService.getEvidence(
      user.userId,
      parsed.data.evidenceId,
    );

    return {
      success: true,
      message: "Evidence fetched successfully.",
      data: evidence,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[getEvidence] unexpected error:", error);
    return { success: false, message: "Failed to fetch evidence." };
  }
}