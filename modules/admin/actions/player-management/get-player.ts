"use server";

import { AuditActorType } from "@/app/generated/prisma/enums";
import { requireAuth } from "@/modules/auth/authorization/require-auth";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { playerManagementService } from "../../services/player-management.service";
import { getPlayerSchema } from "../../validations/player-management/get-player.schema";

/**
 * Gets a single player for the Admin player-management view.
 *
 * Flow:
 *   authentication → actor construction → service authorization → service read → DTO
 *
 * The player ID is supplied by the Admin UI and is passed directly to the
 * service. The service is responsible for validating that the target is
 * actually a player and for shaping NOT_FOUND responses.
 *
 * No database access, authorization logic, mapping, or error translation
 * belongs in this Server Action.
 */
export async function getPlayer(playerId: string) {
  const user = await requireAuth();

  const validated = getPlayerSchema.parse({ playerId });

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  return playerManagementService.getPlayer(actor, validated.playerId);
}
