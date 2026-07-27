"use server";

import { redirect } from "next/navigation";

import { authService } from "@/modules/auth/services/auth.service";
import { registerSchema } from "@/modules/auth/validations/register.schema";
import { getRequestMetadata } from "@/lib/get-request-metadata";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { RATE_LIMITS } from "@/lib/rate-limit/rate-limit.constants";
import { ApiError } from "@/lib/errors/ApiError";
import type { RegisterActionState } from "@/modules/auth/types/action-state";

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const metadata = await getRequestMetadata();

 const globalLimit = await checkRateLimit({
    action: "register",
    identifier: "global",
    ...RATE_LIMITS.REGISTER_GLOBAL,
  });

  if (!globalLimit.allowed) {
    return {
      success: false,
      message:
        "The system is experiencing high load. Please try again in a moment.",
    };
  }

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await authService.register(parsed.data);
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    console.error("[registerAction] unexpected error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }

  redirect("/login?registered=true");
}
