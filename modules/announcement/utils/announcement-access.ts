// announcement-access.ts

import type { AuditActor } from "@/modules/audit/types/audit.types";
import { hasPermission } from "@/modules/auth/authorization/has-permission";
import { Permission } from "@/modules/auth/authorization/permission";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

// announcement-access.ts

/**
 * Asserts that `actor` is permitted to create, update, or archive
 * announcements. Every mutating Announcement operation shares this
 * exact rule — one exported function, not three independent copies of
 * the same permission check, which is what happens if this stays a
 * private per-instance method three call sites each trust themselves to
 * call correctly.
 *
 * Permission semantics preserved exactly from the prior private
 * implementation: throws ApiError.forbidden(PERMISSION_DENIED, "You do
 * not have permission to manage announcements.") when actorRole is
 * missing or lacks Permission.MANAGE_ANNOUNCEMENTS. No change to who is
 * allowed to manage announcements, no new permission introduced.
 */
export function assertCanManageAnnouncements(actor: AuditActor): void {
  if (
    !actor.actorRole ||
    !hasPermission(actor.actorRole, Permission.MANAGE_ANNOUNCEMENTS)
  ) {
    throw ApiError.forbidden(
      ErrorCode.PERMISSION_DENIED,
      "You do not have permission to manage announcements.",
    );
  }
}
