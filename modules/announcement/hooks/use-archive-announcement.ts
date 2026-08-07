"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArchiveAnnouncementDTO } from "../types/announcement.dto";
import { ArchiveAnnouncementSchema } from "../validations/archive-announcement.schema";
import { archiveAnnouncement } from "../actions/archive-announcement";
import { announcementKeys } from "../constants/announcement.keys";

/**
 * Archives an announcement and invalidates both its detail cache and
 * the announcement list cache on success.
 *
 * Returns the standard TanStack Query mutation object
 * (`mutate`/`mutateAsync`/`isPending`/`isError`/`error`/etc.) untouched
 * — this hook does not wrap, rename, or reshape any part of it. On
 * success, `data` is exactly the ArchiveAnnouncementDTO the Server
 * Action returned.
 *
 * Errors are not caught or transformed here — a validation failure, a
 * permission failure, a not-found, an already-archived conflict, or an
 * unexpected server error all surface through the mutation's own
 * `error`/`isError` state exactly as archiveAnnouncement() threw them.
 */
export function useArchiveAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation<ArchiveAnnouncementDTO, Error, ArchiveAnnouncementSchema>({
    mutationFn: (input) => archiveAnnouncement(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: announcementKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}
