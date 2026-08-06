// announcement.types.ts

import type {
  Announcement,
  AnnouncementPriority,
  User,
} from "@/app/generated/prisma/client";

/**
 * Announcement together with its creator.
 *
 * Used whenever the service needs announcement metadata along with the
 * administrator who created it, avoiding separate database lookups.
 */
export type AnnouncementWithAuthor = Announcement & {
  createdBy: Pick<User, "id" | "fullName">;
};

/**
 * Data required to create a new announcement.
 *
 * Used internally by the service after validation has completed.
 */
export interface CreateAnnouncementInput {
  readonly title: string;
  readonly message: string;
  readonly priority: AnnouncementPriority;
  readonly createdById: string;
}

/**
 * Data required to update an existing announcement.
 *
 * All content fields are optional because an administrator may edit
 * only part of an announcement.
 */
export interface UpdateAnnouncementInput {
  title?: string;
  message?: string;
  priority?: AnnouncementPriority;
}

/**
 * Parameters for retrieving a paginated announcement list.
 *
 * Used by repository and service methods.
 */
export interface AnnouncementListQuery {
  page: number;
  pageSize: number;
}

/**
 * Paginated announcement result returned by the repository.
 *
 * The mapper converts this into DTOs before it reaches the frontend.
 */
export interface AnnouncementListResult {
  announcements: AnnouncementWithAuthor[];
  total: number;
}
