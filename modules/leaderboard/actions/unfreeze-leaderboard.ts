"use server";

import { requirePermission } from "@/modules/auth/authorization/require-role";
import { Permission } from "@/modules/auth/authorization/permission";
import { ApiError } from "@/lib/errors/ApiError";

import { leaderboardService } from "../services/leaderboard.service";
import type { ActionState } from "@/lib/action-state";
import { AuditActor } from "@/modules/audit/types/audit.types";
import { AuditActorType } from "@/app/generated/prisma/enums";

export async function unfreezeLeaderboard(): Promise<ActionState<void>> {
  try {
    const user = await requirePermission(Permission.MANAGE_EVENTS);

    const actor: AuditActor = {
      actorType: AuditActorType.ADMIN,
      actorId: user.userId,
      actorUsername: user.name,
      actorRole: user.role,
    };

    await leaderboardService.unfreezeLeaderboard(actor);

    return { success: true, message: "Leaderboard unfrozen." };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }

    console.error("[unfreezeLeaderboard] unexpected error:", error);
    return { success: false, message: "Failed to unfreeze leaderboard." };
  }
}
