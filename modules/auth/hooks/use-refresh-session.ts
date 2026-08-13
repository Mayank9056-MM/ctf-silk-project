"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  refreshSessionAction,
  type RefreshSessionResult,
} from "../actions/refresh-session";
import { authKeys } from "../constants/auth.keys";

/**
 * Thin TanStack wrapper around refreshSessionAction. Adds no policy of
 * its own beyond keeping the cached session in sync with that action's
 * existing, documented contract:
 *
 *   - on success, writes the returned user straight into
 *     authKeys.session()'s cache via setQueryData rather than
 *     invalidating-and-refetching — the action already made the DB
 *     round-trip; a second read would be redundant.
 *   - on requiresReauth: true, clears the cached session (sets it to
 *     null) so any mounted useSession() consumer immediately reflects
 *     "logged out" — but does NOT redirect. Navigation stays the
 *     caller's responsibility, exactly as refreshSessionAction's own
 *     doc comment specifies, and exactly how SessionProvider and
 *     SessionRecovery already handle it themselves.
 *   - on a transient failure (requiresReauth: false), the cache is
 *     left untouched — a DB blip shouldn't make a still-valid session
 *     appear logged out.
 *
 * Does NOT own a polling/interval schedule — SessionProvider already
 * does that (jittered interval + Web Locks + BroadcastChannel
 * coordination for multi-tab safety). This hook is for on-demand call
 * sites — e.g. an explicit "refresh session" action in a player menu —
 * that want the result as mutation state (isPending/isError) instead
 * of raw promise handling.
 */
export function useRefreshSession() {
  const queryClient = useQueryClient();

  return useMutation<RefreshSessionResult, Error, void>({
    mutationFn: () => refreshSessionAction(),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.setQueryData(authKeys.session(), result.user);
      } else if (result.requiresReauth) {
        queryClient.setQueryData(authKeys.session(), null);
      }
    },
  });
}