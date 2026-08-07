"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateAnnouncementDTO } from "../types/announcement.dto";
import { CreateAnnouncementSchema } from "../validations/create-announcement.schema";
import { createAnnouncement } from "../actions/create-announcement";
import { announcementKeys } from "../constants/announcement.keys";

/**
 * Creates a new announcement and invalidates the announcement list
 * cache on success.
 *
 * Returns the standard TanStack Query mutation object
 * (`mutate`/`mutateAsync`/`isPending`/`isError`/`error`/etc.) untouched
 * — this hook does not wrap, rename, or reshape any part of it. On
 * success, `data` is exactly the CreateAnnouncementDTO the Server
 * Action returned.
 *
 * Errors are not caught or transformed here — a validation failure, a
 * permission failure, or an unexpected server error all surface through
 * the mutation's own `error`/`isError` state exactly as
 * createAnnouncement() threw them.
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation<CreateAnnouncementDTO, Error, CreateAnnouncementSchema>({
    mutationFn: (input) => createAnnouncement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}
