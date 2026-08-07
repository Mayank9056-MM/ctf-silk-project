import type { Announcement } from "@/app/generated/prisma/client";

import type {
  AnnouncementListResult,
  AnnouncementWithAuthor,
} from "../types/announcement.types";
import type {
  AnnouncementDTO,
  AnnouncementListDTO,
  CreateAnnouncementDTO,
  UpdateAnnouncementDTO,
  ArchiveAnnouncementDTO,
  AnnouncementAdminDTO,
} from "../types/announcement.dto";

/**
 * The canonical mapper. Every other function in this file reuses it —
 * this is the one place that decides an AnnouncementDTO never carries
 * author information, even when the input (AnnouncementWithAuthor)
 * actually has it. The V1 product has no requirement for a client to
 * know which administrator posted something, and this is where that
 * omission is enforced structurally rather than left for every call
 * site to remember on its own.
 */
export function toAnnouncementDTO(announcement: Announcement): AnnouncementDTO {
  return {
    id: announcement.id,
    title: announcement.title,
    message: announcement.message,
    priority: announcement.priority,
    status: announcement.status,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  };
}

export function toAdminAnnouncementDTO(
  announcement: AnnouncementWithAuthor,
): AnnouncementAdminDTO {
  return {
    ...toAnnouncementDTO(announcement),
    author: {
      id: announcement.createdBy.id,
      name: announcement.createdBy.fullName,
    },
  };
}

/**
 * Maps a paginated repository result into the list response a client
 * renders. Every item goes through toAnnouncementDTO() — no separate
 * mapping logic for list items vs. single reads. `totalPages` is the
 * only derived value this function computes; page/pageSize are echoed
 * back as received, not recalculated, since the repository's `total`
 * count combined with the caller's own requested page size is already
 * everything needed.
 */
export function toAnnouncementListDTO(
  result: AnnouncementListResult,
  page: number,
  pageSize: number,
): AnnouncementListDTO {
  return {
    announcements: result.announcements.map(toAnnouncementDTO),
    total: result.total,
    page,
    pageSize,
    totalPages: Math.ceil(result.total / pageSize),
  };
}

/** Wraps a newly created announcement for the create action's response. */
export function toCreateAnnouncementDTO(
  announcement: Announcement,
): CreateAnnouncementDTO {
  return { announcement: toAnnouncementDTO(announcement) };
}

/** Wraps a freshly updated announcement for the update action's response. */
export function toUpdateAnnouncementDTO(
  announcement: Announcement,
): UpdateAnnouncementDTO {
  return { announcement: toAnnouncementDTO(announcement) };
}

/** Wraps a freshly archived announcement for the archive action's response. */
export function toArchiveAnnouncementDTO(
  announcement: Announcement,
): ArchiveAnnouncementDTO {
  return { announcement: toAnnouncementDTO(announcement) };
}
