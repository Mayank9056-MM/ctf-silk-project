"use client";

import { useQuery } from "@tanstack/react-query";
import { getSessionAction } from "../actions/get-session";
import { authKeys } from "../constants/auth.keys";

/**
 * The current authenticated user, read client-side. Wraps
 * getSessionAction() — a fresh DB read keyed off the verified access
 * token — rather than trusting any client-cached copy of identity.
 *
 * No custom staleTime override: inherits QueryProvider's default
 * (60s, retry: 1, refetchOnWindowFocus: false), which is fine for an
 * identity that rarely changes mid-session. Matches useAnnouncement/
 * useNotifications' plain useQuery pattern — no bespoke caching policy
 * invented here.
 *
 * Returns `data: null` for "no session," never throws — an
 * unauthenticated visitor hitting this hook (e.g. briefly, before a
 * redirect resolves) is expected, not exceptional. Consumers check
 * `data`, not `isError`.
 *
 * Does not itself attempt a refresh when `data` is null — that's
 * SessionProvider's job (it proactively refreshes on a jittered
 * interval before the access token expires) and useRefreshSession's
 * job for on-demand cases. This hook only ever reports what's true
 * right now; composing a "try refreshing if logged out" behavior on
 * top is the caller's responsibility, not something baked in here.
 */
export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: () => getSessionAction(),
  });
}