"use server";

import { announcementService } from "../services/announcement.service";
import { AnnouncementListDTO } from "../types/announcement.dto";
import { getAnnouncementsSchema } from "../validations/get-announcements.schema";

/**
 * Retrieves a paginated, newest-first list of published announcements.
 *
 * Validate → service → return. No authentication step — this action
 * calls the public list path, and the result is inherently safe by
 * construction (see announcementService.getAnnouncements()'s own
 * comment: the repository filters to PUBLISHED at the query level, so
 * there is no visibility decision left for this action or the service
 * to make with an actor).
 *
 * Errors are not caught here. A validation failure (thrown by
 * getAnnouncementsSchema.parse()) or an unexpected service failure
 * propagates as the real error it is.
 */
export async function getAnnouncements(
  input: unknown,
): Promise<AnnouncementListDTO> {
  const validated = getAnnouncementsSchema.parse(input);

  return announcementService.getAnnouncements(validated);
}
