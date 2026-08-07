"use server";

import { requirePermission } from "@/modules/auth/authorization/require-role";
import { Permission } from "@/modules/auth/authorization/permission";
import { ApiError } from "@/lib/errors/ApiError";

import { leaderboardService } from "../services/leaderboard.service";
import type { ActionState } from "@/lib/action-state";
import { AuditActor } from "@/modules/audit/types/audit.types";
import { AuditActorType } from "@/app/generated/prisma/enums";

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
    const user = await requirePermission(Permission.MANAGE_EVENTS);

    const actor: AuditActor = {
      actorType: AuditActorType.ADMIN,
      actorId: user.userId,
      actorUsername: user.name,
      actorRole: user.role,
    };

    await leaderboardService.freezeLeaderboard(actor);

    return { success: true, message: "Leaderboard frozen." };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[freezeLeaderboard] unexpected error:", error);
    return { success: false, message: "Failed to freeze leaderboard." };
  }
}
