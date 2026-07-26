import { useMutation, useQueryClient } from "@tanstack/react-query";

import { submitFlag } from "../actions/submit-flag";
import { submissionKeys } from "../constants/submission.keys";
import { challengeKeys } from "@/modules/challenge/constants/challenge.keys";

interface SubmitFlagVariables {
  challengeId: string;
  flag: string;
}

/**
 * Deliberately no optimistic update. For a live event deciding a real
 * prize, showing "solved!" before the server has actually confirmed it
 * is the wrong trade-off — a network hiccup or a false-positive UI state
 * at the exact moment a player is racing a countdown is worse than a
 * brief, honest pending state while the request is in flight.
 *
 * Invalidation is split by outcome:
 *   - submissionKeys.mine() always invalidates — every attempt, right or
 *     wrong, is logged, so the history view is stale after any attempt.
 *   - challengeKeys.all only invalidates on a correct answer — a wrong
 *     guess doesn't change anything at the challenge level worth
 *     re-fetching for. This also becomes the natural place challenge
 *     list data picks up a future per-player solved/unlocked field once
 *     getChallengeAccess() exists — invalidating now costs one harmless
 *     extra fetch; skipping it would mean silently stale UI the day that
 *     field ships.
 */
export function useSubmitFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, flag }: SubmitFlagVariables) => {
      const result = await submitFlag(challengeId, flag);

      if (!result.success || !result.data) {
        throw new Error(result.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine });

      if (data.isCorrect) {
        queryClient.invalidateQueries({ queryKey: challengeKeys.all });
      }
    },
  });
}
