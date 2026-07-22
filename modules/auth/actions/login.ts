"use server";

import { redirect } from "next/navigation";

import { authService } from "@/modules/auth/services/auth.service";
import { loginSchema } from "@/modules/auth/validations/login.schema";
import { getRequestMetadata } from "@/modules/auth/utils/get-request-metadata";
import { ApiError } from "@/lib/errors/ApiError";

const DEFAULT_REDIRECT_PATH = "/dashboard";

export interface LoginActionState {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export const INITIAL_LOGIN_ACTION_STATE: LoginActionState = { success: false };

/**
 * Only allow relative, same-origin paths for post-login redirects.
 * A bare "startsWith('/')" check isn't enough on its own — "//evil.com" is a
 * protocol-relative URL that browsers treat as absolute, so it's rejected
 * explicitly. Without this, a "next"/"callbackUrl" field becomes an open
 * redirect: an attacker crafts a login link that sends a real user to a
 * phishing page right after they authenticate.
 */
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
 * Server Action for the login form. Signature matches React's
 * `useActionState(loginAction, INITIAL_LOGIN_ACTION_STATE)` so the form
 * works with progressive enhancement (submits and redirects correctly even
 * without JS) and reports field-level validation errors back to the client.
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
      // ApiError messages are already written to be user-facing (see
      // ACCOUNT_LOCKED, ACCOUNT_BANNED, INVALID_CREDENTIALS in auth.service) —
      // safe to surface directly rather than mapping per error code here.
      return { success: false, message: error.message };
    }

    // Anything else is unexpected (DB down, etc.) — log the real error for
    // debugging, but never leak internals to the client.
    console.error("[loginAction] unexpected error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }

  // redirect() throws internally by design — it must stay outside the try
  // block above, or Next's own control-flow exception gets swallowed by our
  // catch and treated as an application error.
  redirect(redirectTo);
}
