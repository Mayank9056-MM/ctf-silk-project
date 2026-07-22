"use server";

import { redirect } from "next/navigation";

import { authService } from "@/modules/auth/services/auth.service";
import { registerSchema } from "@/modules/auth/validations/register.schema";
import { ApiError } from "@/lib/errors/ApiError";
import type { RegisterActionState } from "@/modules/auth/types/action-state";

/**
 * See login.ts's comment — a "use server" file may only export async
 * functions, so RegisterActionState/INITIAL_REGISTER_ACTION_STATE live in
 * modules/auth/types/action-state.ts.
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