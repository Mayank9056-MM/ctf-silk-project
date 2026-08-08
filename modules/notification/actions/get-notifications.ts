"use server";

// get-notifications.ts

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { notificationService } from "@/modules/notification/services/notification.service";
import { getNotificationsSchema } from "@/modules/notification/validations/get-notifications.schema";
import type { NotificationListDTO } from "@/modules/notification/types/notification.dto";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { AuditActorType } from "@/app/generated/prisma/enums";

/**
 * Retrieves the authenticated user's own paginated notification list.
 *
 * Auth → validate → service → return. Scoping to the caller's own
 * notifications happens entirely inside
 * notificationService.getNotifications(), which passes actor.actorId to
 * the repository — this action never touches page/pageSize beyond
 * forwarding what the schema already validated.
 *
 * Errors are not caught here. A validation failure (thrown by
 * getNotificationsSchema.parse()) or an unexpected service failure
 * propagates as the real error it is.
 */
export async function getNotifications(
  input: unknown,
): Promise<NotificationListDTO> {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.USER,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  const validated = getNotificationsSchema.parse(input);

  return notificationService.getNotifications(actor, validated);
}
