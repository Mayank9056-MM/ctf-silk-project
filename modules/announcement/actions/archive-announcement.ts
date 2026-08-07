"use server";

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { announcementService } from "@/modules/announcement/services/announcement.service";
import type { ArchiveAnnouncementDTO } from "@/modules/announcement/types/announcement.dto";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { AuditActorType } from "@/app/generated/prisma/enums";
import { archiveAnnouncementSchema } from "../validations/archive-announcement.schema";

/**
 * Archives an announcement.
 *
 * Auth → validate → service → return. `id` is the only field this
 * operation needs, matching announcementService.archiveAnnouncement()'s
 * own (actor, id) signature — the validated result is destructured
 * rather than passed through as an object, since there is no
 * accompanying content payload the way update has.
 *
 * Errors are not caught here. A validation failure (thrown by
 * archiveAnnouncementSchema.parse()), a permission failure, a
 * not-found, an already-archived conflict, or an unexpected service
 * failure all propagate as the real error they are — this action does
 * not translate, wrap, or swallow any of them.
 */
export async function archiveAnnouncement(
  input: unknown,
): Promise<ArchiveAnnouncementDTO> {
  const user = await requireAuth();

  const actor: AuditActor = {
    actorType: AuditActorType.ADMIN,
    actorId: user.userId,
    actorUsername: user.name,
    actorRole: user.role,
  };

  const { id } = archiveAnnouncementSchema.parse(input);

  return announcementService.archiveAnnouncement(actor, id);
}
