"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { announcementService } from "../services/announcement.service";
import { createAnnouncementSchema } from "../validations/create-announcement.schema";
import type { CreateAnnouncementDTO } from "../types/announcement.dto";
import type { AuditActor } from "@/modules/audit/types/audit.types";

/**
 * Creates a new announcement.
 *
 * Auth → validate → service → return. Nothing else. `createdById` is
 * never accepted from `input` — the actor identity is resolved from
 * the authenticated session via requireAuth(), and
 * announcementService.createAnnouncement() derives createdById from
 * that actor internally. A client has no way to attribute an
 * announcement to anyone but themselves.
 *
 * Errors are not caught here. A validation failure, a permission
 * failure, or an unexpected service failure all propagate as the real
 * ApiError (or unexpected error) they are — this action does not
 * translate, wrap, or swallow any of them, matching how every other
 * mutation in this codebase treats its own error path.
 */
export async function createAnnouncement(
  input: unknown,
): Promise<CreateAnnouncementDTO> {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: "ADMIN",
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  const validated = createAnnouncementSchema.parse(input);

  return announcementService.createAnnouncement(actor, validated);
}
