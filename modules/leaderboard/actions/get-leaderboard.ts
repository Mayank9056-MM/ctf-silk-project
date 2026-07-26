"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { leaderboardService } from "../services/leaderboard.service";
import { getLeaderboardSchema } from "../validations/get-leaderboard.schema";
import type { ActionState } from "@/lib/action-state";
import type { LeaderboardDTO } from "../types/leaderboard.dto";

/**
 * requireAuth() rather than requirePermission() — viewing the leaderboard
 * is a baseline capability of being a signed-in player, same reasoning as
 * getMySubmissions. Permission.VIEW_LEADERBOARD does exist and both roles
 * currently grant it, but it's not enforced here on purpose: if that ever
 * needs to change (e.g. hiding the board pre-event even from signed-in
 * players), that's a real authorization decision, not a rubber-stamp
 * check — worth adding requirePermission(Permission.VIEW_LEADERBOARD)
 * explicitly at that point rather than treating "authenticated" and
 * "has this permission" as interchangeable today.
 *
 * page/pageSize are read as query-string-shaped raw values so this
 * action can be called with plain strings from a URL-driven pagination
 * component (`getLeaderboard(searchParams.get("page"), ...)`) without the
 * caller needing to pre-parse — getLeaderboardSchema's z.coerce.number()
 * handles the string→number conversion and defaulting.
 */
export async function getLeaderboard(
  page?: string | number,
  pageSize?: string | number,
): Promise<ActionState<LeaderboardDTO>> {
  try {
    await requireAuth();

    const parsed = getLeaderboardSchema.safeParse({ page, pageSize });

    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid pagination parameters.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const leaderboard = await leaderboardService.getLeaderboard(
      parsed.data.page,
      parsed.data.pageSize,
    );

    return {
      success: true,
      message: "Leaderboard fetched successfully.",
      data: leaderboard,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[getLeaderboard] unexpected error:", error);
    return { success: false, message: "Failed to fetch leaderboard." };
  }
}