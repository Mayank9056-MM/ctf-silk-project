"use server";

import { AuditActorType } from "@/app/generated/prisma/enums";
import { requireAuth } from "@/modules/auth/authorization/require-auth";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { PlayerSearchQuery } from "../../types/player-management.types";
import { playerManagementService } from "../../services/player-management.service";

/**
 * Gets the paginated player list for the Admin player-management view.
 *
 * Flow:
 *   authentication → actor construction → service authorization
 *   → player search → DTO
 *
 * The query should already be validated by the caller's validation layer.
 * This action does not perform database access, filtering, pagination
 * calculations, authorization, mapping, or error translation.
 */
export async function getPlayers(query: PlayerSearchQuery) {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  return playerManagementService.getPlayers(actor, query);
}
