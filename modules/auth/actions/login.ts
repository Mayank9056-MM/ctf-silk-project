"use server";

import { redirect } from "next/navigation";

import { authService } from "@/modules/auth/services/auth.service";
import { loginSchema } from "@/modules/auth/validations/login.schema";
import { getRequestMetadata } from "@/lib/get-request-metadata";
import { ApiError } from "@/lib/errors/ApiError";
import type { LoginActionState } from "@/modules/auth/types/action-state";
import { AUTH_CONSTANTS } from "../constants/auth.constants";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { RATE_LIMITS } from "@/lib/rate-limit/rate-limit.constants";

function sanitizeRedirectPath(value: FormDataEntryValue | null): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return AUTH_CONSTANTS.DEFAULT_REDIRECT_PATH;
  }
  return value;
}

/**
 * A "use server" file may only export async functions — the shared
 * LoginActionState type and its initial value live in
 * modules/auth/types/action-state.ts instead of here for that reason.
 */
export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const redirectTo = sanitizeRedirectPath(formData.get("redirectTo"));
  const metadata = await getRequestMetadata();

  const globalLimit = await checkRateLimit({
    action: "login",
    identifier: "global",
    ...RATE_LIMITS.LOGIN_GLOBAL,
  });

  if (!globalLimit.allowed) {
    return {
      success: false,
      message:
        "The system is experiencing high load. Please try again in a moment.",
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Per-email, after validation — stops one targeted account being
  // hammered across many rotating IPs, independent of the IP check above.
  const emailLimit = await checkRateLimit({
    action: "login:email",
    identifier: parsed.data.email,
    ...RATE_LIMITS.LOGIN_PER_EMAIL,
  });

  if (!emailLimit.allowed) {
    return {
      success: false,
      message: "Too many attempts for this account. Please try again later.",
    };
  }

  try {
    await authService.login(parsed.data, metadata);
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    console.error("[loginAction] unexpected error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }

  redirect(redirectTo);
}
