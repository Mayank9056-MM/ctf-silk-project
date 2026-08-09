"use server";

import { AuditActorType } from "@/app/generated/prisma/enums";
import { AuditActor } from "@/modules/audit/types/audit.types";
import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { eventControlService } from "../../services/event-control.service";

/**
 * Gets the current EventControl state.
 *
 * Auth → construct actor → service → return.
 *
 * No client-controlled event ID is accepted because the platform
 * operates on the configured Event singleton. Authorization remains
 * owned by EventControlService through assertCanManageEventControl().
 *
 * This is a read-only operation, so the action performs no audit
 * recording and contains no transaction or persistence logic.
 *
 * Errors are intentionally not caught here. Authentication,
 * authorization, not-found, and unexpected service errors propagate
 * unchanged.
 */
export async function getEventControl() {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  return eventControlService.getEventControl(actor);
}
