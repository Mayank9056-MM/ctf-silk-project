"use server";

// get-notification.ts

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { notificationService } from "@/modules/notification/services/notification.service";
import { getNotificationSchema } from "@/modules/notification/validations/get-notification.schema";
import type { NotificationDTO } from "@/modules/notification/types/notification.dto";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { AuditActorType } from "@/app/generated/prisma/enums";

/**
 * Retrieves one notification belonging to the authenticated user.
 *
 * Auth → validate → service → return. Ownership is enforced entirely
 * inside notificationService.getNotification() (see that method's
 * findOwnedNotificationOrThrow() helper) — a mismatch between the
 * requested id's owner and the authenticated actor surfaces as
 * NOT_FOUND, not FORBIDDEN, by that service's own deliberate design
 * (see its doc comment on why a distinguishing error would itself be an
 * information leak). This action does not know or care which outcome
 * occurred; it only propagates whatever the service returns or throws.
 *
 * Errors are not caught here. A validation failure (thrown by
 * getNotificationSchema.parse()), a not-found/not-owned rejection, or
 * an unexpected service failure all propagate as the real error they
 * are.
 */
export async function getNotification(
  input: unknown,
): Promise<NotificationDTO> {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.USER,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  const { id } = getNotificationSchema.parse(input);

  return notificationService.getNotification(actor, id);
}
