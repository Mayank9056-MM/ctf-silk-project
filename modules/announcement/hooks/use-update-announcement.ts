"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateAnnouncementDTO } from "../types/announcement.dto";
import { UpdateAnnouncementSchema } from "../validations/update-announcement.schema";
import { updateAnnouncement } from "../actions/update-announcement";
import { announcementKeys } from "../constants/announcement.keys";

/**
 * Updates an existing announcement and invalidates both its detail
 * cache and the announcement list cache on success.
 *
 * Returns the standard TanStack Query mutation object
 * (`mutate`/`mutateAsync`/`isPending`/`isError`/`error`/etc.) untouched
 * — this hook does not wrap, rename, or reshape any part of it. On
 * success, `data` is exactly the UpdateAnnouncementDTO the Server
 * Action returned.
 *
 * Errors are not caught or transformed here — a validation failure, a
 * permission failure, a not-found, or an unexpected server error all
 * surface through the mutation's own `error`/`isError` state exactly as
 * updateAnnouncement() threw them.
 */
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation<UpdateAnnouncementDTO, Error, UpdateAnnouncementSchema>({
    mutationFn: (input) => updateAnnouncement(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: announcementKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}
