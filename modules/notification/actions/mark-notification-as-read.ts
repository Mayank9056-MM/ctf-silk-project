"use server";

// mark-notification-as-read.ts

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { notificationService } from "@/modules/notification/services/notification.service";
import { markNotificationAsReadSchema } from "@/modules/notification/validations/mark-notification-as-read.schema";
import type { MarkNotificationAsReadDTO } from "@/modules/notification/types/notification.dto";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { AuditActorType } from "@/app/generated/prisma/enums";

/**
 * Marks one notification as read, if — and only if — it belongs to the
 * authenticated user.
 *
 * Auth → validate → service → return. Ownership is enforced entirely
 * inside notificationService.markNotificationAsRead() (see that
 * method's findOwnedNotificationOrThrow() helper) — a mismatch between
 * the requested id's owner and the authenticated actor surfaces as
 * NOT_FOUND, not FORBIDDEN, by that service's own deliberate design.
 * This action does not know or care which outcome occurred; it only
 * propagates whatever the service returns or throws.
 *
 * Errors are not caught here. A validation failure (thrown by
 * markNotificationAsReadSchema.parse()), a not-found/not-owned
 * rejection, or an unexpected service failure all propagate as the real
 * error they are.
 */
export async function markNotificationAsRead(
  input: unknown,
): Promise<MarkNotificationAsReadDTO> {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.USER,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  const { id } = markNotificationAsReadSchema.parse(input);

  return notificationService.markNotificationAsRead(actor, id);
}
