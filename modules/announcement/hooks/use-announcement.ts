"use client";

import { useQuery } from "@tanstack/react-query";
import { AnnouncementDTO } from "../types/announcement.dto";
import { announcementKeys } from "../constants/announcement.keys";
import { getAnnouncement } from "../actions/get-announcement";

export function useAnnouncement(id: string | undefined | null) {
  return useQuery<AnnouncementDTO>({
    queryKey: announcementKeys.detail(id ?? ""),
    queryFn: () => getAnnouncement({ id }),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}
