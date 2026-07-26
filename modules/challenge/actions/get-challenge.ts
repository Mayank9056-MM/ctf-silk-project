"use server";

import { ApiError } from "@/lib/errors/ApiError";
import { challengeService } from "../services/challenge.service";
import { challengeSlugSchema } from "../validations/challenge.schema";
import type { PublicChallenge } from "../types/challenge.types";
import type { ActionState } from "@/lib/action-state";

export async function getChallenge(
  slug: string,
): Promise<ActionState<PublicChallenge>> {
  const parsed = challengeSlugSchema.safeParse({ slug });

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid challenge slug.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const challenge = await challengeService.getChallengeBySlug(
      parsed.data.slug,
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
