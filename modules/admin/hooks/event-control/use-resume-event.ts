"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventControlDTO } from "../../types/event-control.dto";
import { resumeEvent } from "../../actions/event-control/resume-event";
import { eventControlKeys } from "../../constants/event-control.keys";

/**
 * Resumes the event and invalidates the EventControl cache on success.
 *
 * No input — the Server Action takes none (it always operates on the
 * platform's one Event singleton), so this hook's mutation variables
 * type is `void`. Call it as `mutate()`, not `mutate(input)`. A
 * resume-event.schema.ts file exists alongside this action, but the
 * action itself never references it — the same shape
 * markAllNotificationsAsRead() had in the Notification module: a
 * schema file for an operation that genuinely takes no
 * client-controlled input.
 *
 * Returns the standard TanStack Query mutation object
 * (`mutate`/`mutateAsync`/`isPending`/`isError`/`error`/etc.) untouched
 * — this hook does not wrap, rename, or reshape any part of it. On
 * success, `data` is exactly the EventControlDTO the Server Action
 * returned.
 *
 * Invalidates eventControlKeys.all — the single key useEventControl()
 * reads from and every EventControl mutation hook invalidates, per
 * that key registry's own doc comment on why EventControl has only one
 * key at all.
 *
 * Errors are not caught or transformed here — a permission failure, a
 * not-currently-paused conflict, or an unexpected server error all
 * surface through the mutation's own `error`/`isError` state exactly as
 * resumeEvent() threw them.
 */
export function useResumeEvent() {
  const queryClient = useQueryClient();

  return useMutation<EventControlDTO, Error, void>({
    mutationFn: () => resumeEvent(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventControlKeys.all });
    },
  });
}
