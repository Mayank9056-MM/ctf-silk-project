"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { submissionService } from "../services/submission.service";
import type { SubmissionDTO } from "../types/submission.dto";
import { ActionState } from "@/lib/action-state";

/**
 * requireAuth() rather than requirePermission() here — "view your own
 * submission history" isn't a distinct capability the permission system
 * models (there's no VIEW_OWN_SUBMISSIONS entry, and forcing this
 * through an ill-fitting permission like VIEW_CHALLENGES would blur what
 * that permission actually means). Being authenticated as some user IS
 * the entire authorization requirement for a self-scoped read — the
 * service only ever queries by the caller's own userId, so there's no
 * separate "can you do this" question beyond "are you signed in."
 */
export async function getMySubmissions(): Promise<
  ActionState<SubmissionDTO[]>
> {
  try {
    const user = await requireAuth();
    const submissions = await submissionService.getMySubmissions(user.userId);

    return {
      success: true,
      message: "Submissions fetched successfully.",
      data: submissions,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[getMySubmissions] unexpected error:", error);
    return { success: false, message: "Failed to fetch submissions." };
  }
}
