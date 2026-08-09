"use server";

import { AuditActorType } from "@/app/generated/prisma/enums";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { playerManagementService } from "../../services/player-management.service";
import { unbanPlayerSchema } from "../../validations/player-management/unban-player.schema";

/**
 * Unbans a player from the Admin player-management panel.
 *
 * Flow:
 *   authentication → actor construction → service authorization
 *   → unban player → audit → notification → DTO
 *
 * The Server Action intentionally contains no business logic.
 * The service owns the status transition, concurrency handling,
 * transaction boundary, audit recording, and notification creation.
 *
 * Errors are allowed to propagate unchanged.
 */
export async function unbanPlayer(playerId: string) {
  const user = await requireAuth();

  const validated = unbanPlayerSchema.parse({ playerId });

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  return playerManagementService.unbanPlayer(actor, validated.playerId);
}
