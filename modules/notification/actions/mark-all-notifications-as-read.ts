"use server";

// mark-all-notifications-as-read.ts

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { notificationService } from "@/modules/notification/services/notification.service";
import type { MarkAllNotificationsAsReadDTO } from "@/modules/notification/types/notification.dto";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { AuditActorType } from "@/app/generated/prisma/enums";

export async function markAllNotificationsAsRead(): Promise<MarkAllNotificationsAsReadDTO> {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.USER,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  return notificationService.markAllNotificationsAsRead(actor);
}
