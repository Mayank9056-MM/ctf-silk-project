"use server";

import { requirePermission } from "@/modules/auth/authorization/require-role";
import { Permission } from "@/modules/auth/authorization/permission";
import { ApiError } from "@/lib/errors/ApiError";

import { submissionService } from "../services/submission.service";
import { submitFlagSchema } from "../validations/submit-flag.schema";
import { toSubmitFlagResultDTO } from "../utils/submission.mapper";
import type { SubmitFlagResultDTO } from "../types/submission.dto";
import { ActionState } from "@/lib/action-state";

/**
 * The identity behind every submission comes from the verified access
 * token via requirePermission(), never from a client-supplied userId.
 * challengeId/flag are the only two arguments this function accepts from
 * the caller — there is no parameter path by which a request could claim
 * to be submitting on someone else's behalf. This is the single most
 * important property of this file for a real, prize-bearing event: a
 * userId taken from client input here would let anyone submit flags as
 * any other player.
 *
 * requirePermission(SUBMIT_FLAG), not requireAuth() — this action maps
 * directly onto a permission that already exists for exactly this
 * purpose, so it goes through the permission system rather than a bare
 * authentication check, keeping "who can submit flags" defined in one
 * place (permission.ts) even though both roles currently grant it.
 */
export async function submitFlag(
  challengeId: string,
  flag: string,
): Promise<ActionState<SubmitFlagResultDTO>> {
  try {
    const user = await requirePermission(Permission.SUBMIT_FLAG);

    const parsed = submitFlagSchema.safeParse({ challengeId, flag });

    if (!parsed.success) {
      return {
        success: false,
        message: "Please check your submission.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const outcome = await submissionService.submitFlag(
      user.userId,
      parsed.data,
    );
    const result = toSubmitFlagResultDTO(outcome);

    return { success: true, message: result.message, data: result };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[submitFlag] unexpected error:", error);
    return { success: false, message: "Failed to submit flag." };
  }
}
