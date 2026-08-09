"use client";

import { useQuery } from "@tanstack/react-query";
import type { EventControlDTO } from "../../types/event-control.dto";
import { eventControlKeys } from "../../constants/event-control.keys";
import { getEventControl } from "../../actions/event-control/get-event-control";

/**
 * Fetches the current EventControl state — the platform's one Event
 * singleton's pause/registration status. Takes no parameters: unlike
 * useAnnouncement(id), there is no id to key by here — see
 * eventControlKeys' own doc comment on why EventControl has no second
 * axis to query against.
 *
 * Returns the standard TanStack Query result object
 * (`data`/`isLoading`/`isError`/etc.) untouched — this hook does not
 * wrap, rename, or reshape any part of it. `data`, when present, is
 * exactly the EventControlDTO the Server Action returned.
 */
export function useEventControl() {
  return useQuery<EventControlDTO>({
    queryKey: eventControlKeys.all,
    queryFn: () => getEventControl(),
    staleTime: 30_000,
  });
}
