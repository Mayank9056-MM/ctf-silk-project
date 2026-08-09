"use server";

import { AuditActorType } from "@/app/generated/prisma/enums";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { playerManagementService } from "../../services/player-management.service";
import { banPlayerSchema } from "../../validations/player-management/ban-player.schema";

/**
 * Bans a player from the Admin player-management panel.
 *
 * Flow:
 *   authentication → actor construction → service authorization
 *   → ban player → audit/session revocation → notification → DTO
 *
 * The Server Action intentionally contains no business logic.
 * Concurrency handling, status validation, transaction boundaries,
 * session revocation, audit recording, and notification creation
 * belong to playerManagementService.
 *
 * Errors are allowed to propagate unchanged.
 */
export async function banPlayer(playerId: string) {
  const user = await requireAuth();

  const validated = banPlayerSchema.parse({ playerId });

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  return playerManagementService.banPlayer(actor, validated.playerId);
}
