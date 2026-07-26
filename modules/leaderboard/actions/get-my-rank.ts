"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { ApiError } from "@/lib/errors/ApiError";

import { leaderboardService } from "../services/leaderboard.service";
import type { ActionState } from "@/lib/action-state";
import type { UserRankDTO } from "../types/leaderboard.dto";

/**
 * No schema, no parameters — the only "input" is the caller's own
 * session identity from requireAuth(). Same shape as getMySubmissions:
 * there is nothing here for a client to supply that the server should
 * ever trust over its own verified session, so there's nothing to
 * validate.
 */
export async function getMyRank(): Promise<ActionState<UserRankDTO>> {
  try {
    const user = await requireAuth();
    const rank = await leaderboardService.getMyRank(user.userId);

    return {
      success: true,
      message: "Rank fetched successfully.",
      data: rank,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[getMyRank] unexpected error:", error);
    return { success: false, message: "Failed to fetch rank." };
  }
}