"use client";

import { useQuery } from "@tanstack/react-query";
import { ANNOUNCEMENT_PAGINATION } from "../constants/announcement.constants";
import { AnnouncementListDTO } from "../types/announcement.dto";
import { announcementKeys } from "../constants/announcement.keys";
import { getAnnouncements } from "../actions/get-announcements";

/**
 * Fetches one page of the newest-first announcement list.
 *
 * @param page - 1-indexed page number. Defaults to 1, matching
 * getAnnouncementsSchema's own default so a caller of this hook and a
 * direct caller of the Server Action agree on what "no page specified"
 * means.
 * @param pageSize - Items per page. Defaults to
 * ANNOUNCEMENT_PAGINATION.DEFAULT_PAGE_SIZE — the same constant the
 * validation schema defaults to — rather than a second, independently
 * chosen number that could drift from it.
 *
 * Returns the standard TanStack Query result object
 * (`data`/`isLoading`/`isError`/etc.) untouched. `data`, when present,
 * is exactly the AnnouncementListDTO the Server Action returned.
 */
export function useAnnouncements(
  page: number = 1,
  pageSize: number = ANNOUNCEMENT_PAGINATION.DEFAULT_PAGE_SIZE,
) {
  return useQuery<AnnouncementListDTO>({
    queryKey: announcementKeys.list(page, pageSize),
    queryFn: () => getAnnouncements({ page, pageSize }),
    staleTime: 30_000,
  });
}
