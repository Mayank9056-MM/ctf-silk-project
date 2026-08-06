import type {
  AnnouncementPriority,
  ContentStatus,
} from "@/app/generated/prisma/enums";

// announcement.dto.ts

/**
 * Public representation of an announcement.
 *
 * Returned to both player-facing and administrator-facing clients.
 *
 * Author information is intentionally omitted. The V1 product has no
 * requirement for players to know which administrator created an
 * announcement, and excluding it avoids accidentally exposing internal
 * user information.
 */
export interface AnnouncementDTO {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated announcement list returned to the frontend.
 */
export interface AnnouncementListDTO {
  announcements: AnnouncementDTO[];

  total: number;

  page: number;

  pageSize: number;

  totalPages: number;
}

/**
 * Response returned after successfully creating an announcement.
 */
export interface CreateAnnouncementDTO {
  announcement: AnnouncementDTO;
}

/**
 * Response returned after successfully updating an announcement.
 */
export interface UpdateAnnouncementDTO {
  announcement: AnnouncementDTO;
}

/**
 * Response returned after successfully archiving an announcement.
 */
export interface ArchiveAnnouncementDTO {
  announcement: AnnouncementDTO;
}
