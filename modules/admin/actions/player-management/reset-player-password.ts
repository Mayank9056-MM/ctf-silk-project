"use server";

import { AuditActorType } from "@/app/generated/prisma/enums";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { playerManagementService } from "../../services/player-management.service";
import { resetPlayerPasswordSchema } from "../../validations/player-management/reset-player-password.schema";

/**
 * Resets a player's password from the Admin player-management panel.
 *
 * Flow:
 *   authentication → actor construction → service authorization
 *   → password reset → session revocation → audit → notification → DTO
 *
 * The temporary password is generated and returned by the service.
 * This action never generates, hashes, stores, logs, or sends the
 * temporary password itself.
 *
 * The Server Action intentionally contains no business logic.
 * Password generation, hashing, concurrent-reset protection,
 * transaction handling, refresh-token revocation, audit recording,
 * and notification creation belong to playerManagementService.
 *
 * Errors are allowed to propagate unchanged.
 */
export async function resetPlayerPassword(playerId: string) {
  const user = await requireAuth();

  const validated = resetPlayerPasswordSchema.parse({ playerId });

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  return playerManagementService.resetPlayerPassword(actor, validated.playerId);
}
