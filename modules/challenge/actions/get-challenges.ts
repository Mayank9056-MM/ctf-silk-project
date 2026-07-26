"use server";

import { ApiError } from "@/lib/errors/ApiError";
import { challengeService } from "../services/challenge.service";
import type { PublicChallenge } from "../types/challenge.types";
import type { ActionState } from "@/lib/action-state";

export async function getChallenges(): Promise<ActionState<PublicChallenge[]>> {
  try {
    const challenges = await challengeService.getChallenges();
    return {
      success: true,
      message: "Challenges fetched successfully.",
      data: challenges,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to fetch challenges." };
  }
}
