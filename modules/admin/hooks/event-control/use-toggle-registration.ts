"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventControlDTO } from "../../types/event-control.dto";
import { enableRegistration } from "../../actions/event-control/enable-registration";
import { disableRegistration } from "../../actions/event-control/disable-registration";
import { eventControlKeys } from "../../constants/event-control.keys";

/**
 * Enables or disables event registration, dispatching to one of two
 * Server Actions based on the mutation variable — enableRegistration()
 * when `true`, disableRegistration() when `false`. One hook covering
 * both directions mirrors eventControlService's own internal
 * setRegistration(actor, enabled) shape, rather than inventing a split
 * here that the backend doesn't have.
 *
 * TVariables is a plain `boolean`, not a schema-derived type — neither
 * underlying action takes client input at all (both are zero-argument,
 * the same shape as resumeEvent()). A toggle-registration.schema.ts
 * file exists alongside these actions, but neither references it. The
 * boolean here is purely local dispatch logic deciding which of the
 * two fixed Server Actions to call — it is never sent to the server as
 * data to be validated.
 *
 * Returns the standard TanStack Query mutation object
 * (`mutate`/`mutateAsync`/`isPending`/`isError`/`error`/etc.) untouched
 * — this hook does not wrap, rename, or reshape any part of it. Call it
 * as `mutate(true)` to enable or `mutate(false)` to disable. On
 * success, `data` is exactly the EventControlDTO the Server Action
 * returned.
 *
 * Invalidates eventControlKeys.all — the single key useEventControl()
 * reads from and every EventControl mutation hook invalidates, per
 * that key registry's own doc comment on why EventControl has only one
 * key at all.
 *
 * Errors are not caught or transformed here — a permission failure or
 * an unexpected server error surfaces through the mutation's own
 * `error`/`isError` state exactly as enableRegistration()/
 * disableRegistration() threw it.
 */
export function useToggleRegistration() {
  const queryClient = useQueryClient();

  return useMutation<EventControlDTO, Error, boolean>({
    mutationFn: (enabled) =>
      enabled ? enableRegistration() : disableRegistration(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventControlKeys.all });
    },
  });
}
