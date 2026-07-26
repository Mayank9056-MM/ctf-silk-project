"use server";

import { requirePermission } from "@/modules/auth/authorization/require-role";
import { Permission } from "@/modules/auth/authorization/permission";
import { ApiError } from "@/lib/errors/ApiError";

import { leaderboardService } from "../services/leaderboard.service";
import type { ActionState } from "@/lib/action-state";

export async function unfreezeLeaderboard(): Promise<ActionState<void>> {
  try {
    await requirePermission(Permission.MANAGE_EVENTS);
    await leaderboardService.unfreezeLeaderboard();

    return { success: true, message: "Leaderboard unfrozen." };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[unfreezeLeaderboard] unexpected error:", error);
    return { success: false, message: "Failed to unfreeze leaderboard." };
  }
}
