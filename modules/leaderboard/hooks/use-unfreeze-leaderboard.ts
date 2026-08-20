"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ActionState } from "@/lib/action-state";
import { unfreezeLeaderboard } from "../actions/unfreeze-leaderboard";

/** Mirror of useFreezeLeaderboard — see that file for the ActionState caveat. */
export function useUnfreezeLeaderboard() {
  const queryClient = useQueryClient();

  return useMutation<ActionState<void>, Error, void>({
    mutationFn: () => unfreezeLeaderboard(),
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.invalidateQueries({ queryKey: ["leaderboard", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard", "page"] });
    },
  });
}
