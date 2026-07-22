"use server";

import { redirect } from "next/navigation";

import { authService } from "@/modules/auth/services/auth.service";
import { loginSchema } from "@/modules/auth/validations/login.schema";
import { getRequestMetadata } from "@/modules/auth/utils/get-request-metadata";
import { ApiError } from "@/lib/errors/ApiError";
import type { LoginActionState } from "@/modules/auth/types/action-state";

const DEFAULT_REDIRECT_PATH = "/dashboard";

function sanitizeRedirectPath(value: FormDataEntryValue | null): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return DEFAULT_REDIRECT_PATH;
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

  try {
    await authService.login(parsed.data, await getRequestMetadata());
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