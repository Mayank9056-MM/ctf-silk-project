import type { Announcement } from "@/app/generated/prisma/client";
import { ContentStatus } from "@/app/generated/prisma/enums";

/**
 * True only when this announcement has been archived. The real check
 * behind archiveAnnouncement() rejecting a double-archive attempt with a
 * clear, specific outcome rather than issuing a redundant UPDATE.
 */
export function isArchived(announcement: Announcement): boolean {
  return announcement.status === ContentStatus.ARCHIVED;
}

/**
 * True only when this announcement is currently published. The real
 * check behind a non-admin single-item read: findAnnouncementById
 * returns any status, so this is what the service uses to decide
 * whether a DRAFT or ARCHIVED row should actually be visible to that
 * caller.
 */
export function isPublished(announcement: Announcement): boolean {
  return announcement.status === ContentStatus.PUBLISHED;
}
