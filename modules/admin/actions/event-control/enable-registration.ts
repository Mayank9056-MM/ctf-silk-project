// enable-registration.ts

"use server";

import { AuditActorType } from "@/app/generated/prisma/enums";
import { AuditActor } from "@/modules/audit/types/audit.types";
import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { toggleRegistrationSchema } from "../../validations/event-control/toggle-registration.schema";
import { eventControlService } from "../../services/event-control.service";

/**
 * Enables event registration.
 *
 * Auth → construct actor → validate → service → return.
 *
 * The actor is derived from the authenticated session and is never
 * accepted from client input. Event resolution, Admin authorization,
 * registration state validation, persistence, and audit recording
 * remain owned by EventControlService.
 *
 * This action represents the explicit "enable registration" operation.
 * The client cannot use the input to select a different operation.
 *
 * Errors are intentionally not caught here. Validation, authorization,
 * business-state, and unexpected service errors propagate unchanged.
 */
export async function enableRegistration(input: unknown) {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  toggleRegistrationSchema.parse(input);

  return eventControlService.enableRegistration(actor);
}
