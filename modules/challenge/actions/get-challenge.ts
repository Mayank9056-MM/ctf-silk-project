// modules/challenge/actions/get-challenge.ts
"use server";

import { ApiError } from "@/lib/errors/ApiError";
import { requirePermission } from "@/modules/auth/authorization/require-role";
import { Permission } from "@/modules/auth/authorization/permission";
import { challengeService } from "../services/challenge.service";
import { challengeIdSchema } from "../validations/challenge.schema";
import type { PlayerChallengeDTO } from "../types/challenge.types";
import type { ActionState } from "@/lib/action-state";

/**
 * Now id-based — see challenge.service.ts's getChallengeForPlayer for
 * why. Route params and Scene.challengeId only ever carry the real
 * Challenge.id (cuid), never a slug.
 */
export async function getChallenge(
  challengeId: string,
): Promise<ActionState<PlayerChallengeDTO>> {
  const parsed = challengeIdSchema.safeParse({ challengeId });

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid challenge ID.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await requirePermission(Permission.VIEW_CHALLENGES);

    const challenge = await challengeService.getChallengeForPlayer(
      user.userId,
      parsed.data.challengeId,
    );
    return {
      success: true,
      message: "Challenge fetched successfully.",
      data: challenge,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to fetch challenge." };
  }
}