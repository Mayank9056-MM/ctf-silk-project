"use server";

import { AuditActorType } from "@/app/generated/prisma/enums";
import { AuditActor } from "@/modules/audit/types/audit.types";
import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { eventControlService } from "../../services/event-control.service";

/**
 * Disables event registration.
 *
 * Auth → construct actor → validate → service → return.
 *
 * The actor is derived from the authenticated session and is never
 * accepted from client input. The event is resolved server-side as
 * the platform's Event singleton.
 *
 * Authorization, registration-state validation, persistence, and
 * audit recording remain owned by EventControlService.
 *
 * Errors are intentionally not caught here. Validation, authorization,
 * business-state, and unexpected service errors propagate unchanged.
 */
export async function disableRegistration() {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  return eventControlService.disableRegistration(actor);
}
