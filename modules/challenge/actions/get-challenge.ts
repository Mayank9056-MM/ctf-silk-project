import { ApiError } from "@/lib/errors/ApiError";
import { challengeService } from "../services/challenge.service";
import { challengeSlugSchema } from "../validations/challenge.schema";
import { PublicChallenge } from "../types/challenge.types";
import { ActionState } from "../types/action-state";

export async function getChallenge(
  slug: string,
): Promise<ActionState<PublicChallenge>> {
  try {
    const validated = challengeSlugSchema.parse({ slug });
    const challenge = await challengeService.getChallengeBySlug(validated.slug);

    return {
      success: true,
      message: "Challenge fetched successfully.",
      data: challenge, // already flagHash-free at the repository level
    };
  } catch (error) {
    if (error instanceof ApiError)
      return { success: false, message: error.message };
    return { success: false, message: "Failed to fetch challenge." };
  }
}
