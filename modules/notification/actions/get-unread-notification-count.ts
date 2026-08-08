"use server";

// get-unread-notification-count.ts

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { notificationService } from "@/modules/notification/services/notification.service";
import type { UnreadNotificationCountDTO } from "@/modules/notification/types/notification.dto";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { AuditActorType } from "@/app/generated/prisma/enums";

/**
 * Retrieves the authenticated user's own unread notification count.
 *
 * Auth → service → return. No validation step exists because this
 * operation accepts no client-controlled input at all — see this file's
 * own header for why.
 *
 * Errors are not caught here. An unexpected service failure propagates
 * as the real error it is.
 */
export async function getUnreadNotificationCount(): Promise<UnreadNotificationCountDTO> {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.USER,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  return notificationService.getUnreadNotificationCount(actor);
}
