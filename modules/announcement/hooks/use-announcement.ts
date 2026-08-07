"use client";

import { useQuery } from "@tanstack/react-query";
import { AnnouncementDTO } from "../types/announcement.dto";
import { announcementKeys } from "../constants/announcement.keys";
import { getAnnouncement } from "../actions/get-announcement";

/**
 * Fetches a single announcement by id.
 *
 * @param id - The announcement's id. When undefined, null, or an empty
 * string, the query is disabled entirely (see `enabled` below) rather
 * than firing a request that getAnnouncementSchema would reject anyway.
 *
 * Returns the standard TanStack Query result object
 * (`data`/`isLoading`/`isError`/etc.) untouched — this hook does not
 * wrap, rename, or reshape any part of it. `data`, when present, is
 * exactly the AnnouncementDTO the Server Action returned.
 */
export function useAnnouncement(id: string | undefined | null) {
  return useQuery<AnnouncementDTO>({
    queryKey: announcementKeys.detail(id ?? ""),
    queryFn: () => getAnnouncement({ id }),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}
