import { useQuery } from "@tanstack/react-query";

import { getChallengeHints } from "../actions/get-challenge-hints";
import { hintKeys } from "../constants/hint.keys";

/**
 * ============================================================================
 * use-challenge-hints.ts
 * ============================================================================
 *
 * Thin TanStack Query wrapper around getChallengeHints().
 *
 * This hook owns ONLY:
 *
 * - query lifecycle
 * - cache configuration
 * - cache keys
 *
 * It intentionally owns NO business logic.
 *
 * Unlock rules, XP affordability, ordering, DTO construction and database
 * access all live on the server.
 *
 * Cache Strategy
 * ---------------------------------------------------------------------------
 * Hint content is effectively static during an event. Only player-specific
 * unlock state changes, and only after unlockHint() succeeds.
 *
 * Therefore:
 *
 * - long staleTime
 * - long gcTime
 * - retry once
 */

export function useChallengeHints(challengeId: string) {
  return useQuery({
    queryKey: hintKeys.challenge(challengeId),

    queryFn: () =>
      getChallengeHints({
        challengeId,
      }),

    enabled: challengeId.trim().length > 0,

    staleTime: 1000 * 60 * 10,

    gcTime: 1000 * 60 * 30,

    retry: 1,
  });
}
