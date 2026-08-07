"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { announcementService } from "../services/announcement.service";
import { updateAnnouncementSchema } from "../validations/update-announcement.schema";
import type { UpdateAnnouncementDTO } from "../types/announcement.dto";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { AuditActorType } from "@/app/generated/prisma/enums";

/**
 * Updates an existing announcement's content.
 *
 * Auth → validate → service → return. `id` is required by the schema
 * and destructured out separately from the rest of the payload,
 * matching announcementService.updateAnnouncement()'s own
 * (actor, id, input) signature.
 *
 * Errors are not caught here. A validation failure (thrown by
 * updateAnnouncementSchema.parse()), a permission failure, a
 * not-found, or an unexpected service failure all propagate as the
 * real error they are — this action does not translate, wrap, or
 * swallow any of them.
 */
export async function updateAnnouncement(
  input: unknown,
): Promise<UpdateAnnouncementDTO> {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  const { id, ...rest } = updateAnnouncementSchema.parse(input);

  return announcementService.updateAnnouncement(actor, id, rest);
}
