// notification-access.ts

import { AuditActorType } from "@/app/generated/prisma/enums";
import type { Notification } from "@/app/generated/prisma/client";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { hasPermission } from "@/modules/auth/authorization/has-permission";
import { Permission } from "@/modules/auth/authorization/permission";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

// notification-access.ts

/**
 * Asserts that `actor` is permitted to create a notification.
 *
 * Two distinct paths:
 *   1. SYSTEM actors (brute-force lockout, refresh-token-reuse
 *      detection, and any future background-triggered notification)
 *      bypass the role check entirely — there is no human role to
 *      check against for a system-initiated event. Mirrors
 *      AUDIT_EVENTS' own `expectedActorTypes: [AuditActorType.SYSTEM]`
 *      pattern for these exact events; without this branch, every
 *      SYSTEM-actor call throws PERMISSION_DENIED unconditionally,
 *      since a SYSTEM actor's actorRole is always null by construction
 *      (see recordSystemEvent() in audit.service.ts for the identical
 *      null-role shape).
 *   2. Every other actor (ADMIN) must hold MANAGE_NOTIFICATIONS,
 *      exactly as before — manual notification creation is still an
 *      administrative action; players never create their own.
 */
export function assertCanCreateNotification(actor: AuditActor): void {
  if (actor.actorType === AuditActorType.SYSTEM) return;

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
