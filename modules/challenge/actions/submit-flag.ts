import { ApiError } from "@/lib/errors/ApiError";
import { challengeService } from "../services/challenge.service";
import { ActionState } from "../types/action-state";
import { SubmitFlagResult } from "../types/challenge.types";
import { submitFlagSchema } from "../validations/submit-flag.schema";

export async function submitFlag(
  challengeId: string,
  flag: string,
): Promise<ActionState<SubmitFlagResult>> {
  const parsed = submitFlagSchema.safeParse({ challengeId, flag });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your submission.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await challengeService.verifyFlag(
      parsed.data.challengeId,
      parsed.data.flag,
    );
    return { success: true, message: result.message, data: result };
  } catch (error) {
    if (error instanceof ApiError)
      return { success: false, message: error.message };
    return { success: false, message: "Failed to submit flag." };
  }
}
