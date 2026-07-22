"use server";

import { redirect } from "next/navigation";

import { authService } from "@/modules/auth/services/auth.service";
import { registerSchema } from "@/modules/auth/validations/register.schema";
import { ApiError } from "@/lib/errors/ApiError";

export interface RegisterActionState {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export const INITIAL_REGISTER_ACTION_STATE: RegisterActionState = {
  success: false,
};

/**
 * Server Action for the registration form. Same useActionState-compatible
 * shape as loginAction — works with progressive enhancement and surfaces
 * field-level Zod errors (including the confirmPassword mismatch refine)
 * back to the client.
 *
 * Registration deliberately does not establish a session — authService
 * .register only creates the account, it never sets cookies. The user is
 * sent to the login page afterward rather than being auto-signed-in.
 */
export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
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
      // EMAIL_ALREADY_EXISTS / USERNAME_ALREADY_EXISTS messages from
      // auth.service are already written to be shown to the user directly.
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