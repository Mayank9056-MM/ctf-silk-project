"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { pauseEventSchema } from "../../validations/event-control/pause-event.schema";
import { AuditActor } from "@/modules/audit/types/audit.types";
import { AuditActorType } from "@/app/generated/prisma/enums";
import { eventControlService } from "../../services/event-control.service";

/**
 * Pauses the event.
 *
 * Auth → construct actor → validate → service → return.
 *
 * The actor is constructed from the authenticated session and is never
 * accepted from client input. Event resolution, Admin authorization,
 * pause-state validation, persistence, and audit recording remain owned
 * by EventControlService.
 *
 * Errors are intentionally not caught here. Validation, authorization,
 * business-state, and unexpected service errors propagate unchanged.
 */
export async function pauseEvent(input: unknown) {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  const validated = pauseEventSchema.parse(input);

  return eventControlService.pauseEvent(actor, validated.reason ?? null);
}
