"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { leaderboardService } from "../services/leaderboard.service";
import { getUserRankSchema } from "../validations/get-user-rank.schema";
import type { ActionState } from "@/lib/action-state";
import type { UserRankDTO } from "../types/leaderboard.dto";

/**
 * requireAuth(), not requirePermission() — same call as getLeaderboard.
 * Looking up ANOTHER player's rank (e.g. from a public profile link) only
 * exposes what getLeaderboard already exposes to every signed-in player
 * (rank, XP, solve count) — nothing here is more sensitive than the
 * leaderboard itself, so there's no separate permission to gate on. This
 * is also exactly why this function returns UserRankDTO, never
 * AdminLeaderboardEntryWithUser/AdminLeaderboardRowDTO — this action must
 * never be the path by which an unprivileged caller reaches a player's
 * email, which is only reachable through getAdminLeaderboard's stricter
 * permission check.
 */
export async function getUserRank(
  userId: string,
): Promise<ActionState<UserRankDTO>> {
  try {
    await requireAuth();

    const parsed = getUserRankSchema.safeParse({ userId });

    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid user ID.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const rank = await leaderboardService.getUserRank(parsed.data.userId);

    return {
      success: true,
      message: "Rank fetched successfully.",
      data: rank,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[getUserRank] unexpected error:", error);
    return { success: false, message: "Failed to fetch rank." };
  }
}
