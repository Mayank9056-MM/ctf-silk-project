// notification-access.ts

import type { Notification } from "@/app/generated/prisma/client";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { hasPermission } from "@/modules/auth/authorization/has-permission";
import { Permission } from "@/modules/auth/authorization/permission";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

// notification-access.ts

/**
 * Asserts that `actor` is permitted to manually create a notification.
 *
 * Manual notification creation is an administrative action — players
 * never create their own notifications; every Notification a player
 * receives is a side effect of some other event (an announcement being
 * published, an account lock, an event schedule change), triggered by
 * the system or an admin action, never by a player's own request.
 */
export function assertCanCreateNotification(actor: AuditActor): void {
  if (
    !actor.actorRole ||
    !hasPermission(actor.actorRole, Permission.MANAGE_NOTIFICATIONS)
  ) {
    throw ApiError.forbidden(
      ErrorCode.PERMISSION_DENIED,
      "You do not have permission to create notifications.",
    );
  }
}

/**
 * Asserts that `notification` belongs to `actor`.
 *
 * The ownership rule is a direct identity comparison —
 * notification.userId === actor.actorId — with no admin bypass built in.
 * An admin needing to read another player's notifications would require
 * its own, separately-justified function; none exists today because no
 * such caller exists (see this file's header on speculative helpers).
 */
export function assertNotificationOwner(
  actor: AuditActor,
  notification: Notification,
): void {
  if (notification.userId !== actor.actorId) {
    throw ApiError.forbidden(
      ErrorCode.PERMISSION_DENIED,
      "You do not have permission to access this notification.",
    );
  }
}
