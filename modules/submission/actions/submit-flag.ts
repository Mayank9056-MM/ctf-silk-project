"use server";

import { requirePermission } from "@/modules/auth/authorization/require-role";
import { Permission } from "@/modules/auth/authorization/permission";
import { getRequestMetadata } from "@/lib/get-request-metadata";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { RATE_LIMITS } from "@/lib/rate-limit/rate-limit.constants";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import { submissionService } from "../services/submission.service";
import { submitFlagSchema } from "../validations/submit-flag.schema";
import { toSubmitFlagResultDTO } from "../utils/submission.mapper";
import type { ActionState } from "@/lib/action-state";
import type { SubmitFlagResultDTO } from "../types/submission.dto";

export async function submitFlag(
  challengeId: string,
  flag: string,
): Promise<ActionState<SubmitFlagResultDTO>> {
  try {
    const metadata = await getRequestMetadata();

 const globalLimit = await checkRateLimit({
    action: "submit-flag",
    identifier: "global",
    ...RATE_LIMITS.SUBMIT_FLAG_GLOBAL,
  });

  if (!globalLimit.allowed) {
    return {
      success: false,
      message:
        "The system is experiencing high load. Please try again in a moment.",
    };
  }

    const user = await requirePermission(Permission.SUBMIT_FLAG);

    const parsed = submitFlagSchema.safeParse({ challengeId, flag });

    if (!parsed.success) {
      return {
        success: false,
        message: "Please check your submission.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const outcome = await submissionService.submitFlag(user.userId, parsed.data);
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