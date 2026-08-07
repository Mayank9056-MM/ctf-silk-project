"use server";

import { announcementService } from "../services/announcement.service";
import { AnnouncementDTO } from "../types/announcement.dto";
import { getAnnouncementSchema } from "../validations/get-announcement.schema";

/**
 * Retrieves a single, published announcement by id.
 *
 * Validate → service → return. No authentication step — this action
 * calls the public read path, and a DRAFT or ARCHIVED announcement is
 * indistinguishable from a nonexistent one to this caller by design
 * (see announcementService.getAnnouncement()'s own isPublished() check).
 *
 * Errors are not caught here. A validation failure (thrown by
 * getAnnouncementSchema.parse()), a not-found, or an unexpected service
 * failure all propagate as the real error they are.
 */
export async function getAnnouncement(
  input: unknown,
): Promise<AnnouncementDTO> {
  const { id } = getAnnouncementSchema.parse(input);

  return announcementService.getAnnouncement(id);
}
