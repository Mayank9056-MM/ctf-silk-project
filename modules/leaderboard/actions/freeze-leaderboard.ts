"use server";

import { requirePermission } from "@/modules/auth/authorization/require-role";
import { Permission } from "@/modules/auth/authorization/permission";
import { ApiError } from "@/lib/errors/ApiError";

import { leaderboardService } from "../services/leaderboard.service";
import type { ActionState } from "@/lib/action-state";

/**
 * Admin-only. Gated on Permission.MANAGE_EVENTS since leaderboardFrozenAt
 * physically lives on Event — if you later want freeze/unfreeze
 * separable from general event administration (e.g. a co-organizer who
 * shouldn't be able to edit the event schedule but should be able to
 * freeze the board), add a dedicated Permission.MANAGE_LEADERBOARD and
 * this is the only line that needs to change.
 *
 * requirePermission() throws before leaderboardService.freezeLeaderboard()
 * ever runs — an unauthorized caller never reaches the point where
 * Event.leaderboardFrozenAt could be written, not just "isn't shown the
 * result."
 */
export async function freezeLeaderboard(): Promise<ActionState<void>> {
  try {
    await requirePermission(Permission.MANAGE_EVENTS);
    await leaderboardService.freezeLeaderboard();

    return { success: true, message: "Leaderboard frozen." };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[freezeLeaderboard] unexpected error:", error);
    return { success: false, message: "Failed to freeze leaderboard." };
  }
}