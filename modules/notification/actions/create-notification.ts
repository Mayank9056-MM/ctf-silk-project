"use server";

// create-notification.ts

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { notificationService } from "@/modules/notification/services/notification.service";
import { createNotificationSchema } from "@/modules/notification/validations/create-notification.schema";
import type { CreateNotificationDTO } from "@/modules/notification/types/notification.dto";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { AuditActorType } from "@/app/generated/prisma/enums";

/**
 * Creates a notification targeting a specific user. Administrative
 * operation — the actual permission check
 * (assertCanCreateNotification, via notification-access.ts) happens
 * inside notificationService.createNotification(), not in this file.
 *
 * input.userId (validated by createNotificationSchema) is the
 * RECIPIENT. It is never confused with actor.actorId, the AUTHENTICATED
 * CALLER — the two are structurally distinct fields with no shared
 * source.
 *
 * Errors are not caught here. A validation failure (thrown by
 * createNotificationSchema.parse()), a permission failure (thrown by
 * assertCanCreateNotification() inside the service), or an unexpected
 * service failure all propagate as the real error they are — this
 * action does not translate, wrap, or swallow any of them, matching how
 * create-announcement.ts and update-announcement.ts treat their own
 * error paths.
 */
export async function createNotification(
  input: unknown,
): Promise<CreateNotificationDTO> {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  const validated = createNotificationSchema.parse(input);

  return notificationService.createNotification(actor, validated);
}
