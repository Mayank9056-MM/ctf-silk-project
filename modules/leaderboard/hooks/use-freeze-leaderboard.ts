"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ActionState } from "@/lib/action-state";
import { freezeLeaderboard } from "../actions/freeze-leaderboard";

/**
 * freezeLeaderboard() returns ActionState<void>, not a thrown ApiError —
 * unlike every other admin mutation hook in this codebase (usePauseEvent,
 * useBanPlayer, etc.). That means a rejection (already frozen, event not
 * started) surfaces as `data.success === false`, NOT as this mutation's
 * `isError`/`error`. Callers must check `data?.success` themselves; see
 * FreezeToggle for the one place that does.
 *
 * Invalidates every leaderboardKeys.admin(...) page on success — admin
 * pagination isn't known here, so a broad predicate match is used rather
 * than a single page/pageSize pair (which would miss whatever page the
 * admin actually has open).
 */
export function useFreezeLeaderboard() {
  const queryClient = useQueryClient();

  return useMutation<ActionState<void>, Error, void>({
    mutationFn: () => freezeLeaderboard(),
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.invalidateQueries({ queryKey: ["leaderboard", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard", "page"] });
    },
  });
}
