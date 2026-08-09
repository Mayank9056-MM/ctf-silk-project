"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventControlDTO } from "../../types/event-control.dto";
import type { PauseEventInput } from "../../validations/event-control/pause-event.schema";
import { pauseEvent } from "../../actions/event-control/pause-event";
import { eventControlKeys } from "../../constants/event-control.keys";

/**
 * Pauses the event and invalidates the EventControl cache on success.
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
 * Errors are not caught or transformed here — a validation failure, a
 * permission failure, an already-paused conflict, or an unexpected
 * server error all surface through the mutation's own `error`/`isError`
 * state exactly as pauseEvent() threw them.
 */
export function usePauseEvent() {
  const queryClient = useQueryClient();

  return useMutation<EventControlDTO, Error, PauseEventInput>({
    mutationFn: (input) => pauseEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventControlKeys.all });
    },
  });
}
