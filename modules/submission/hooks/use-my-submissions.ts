import { useQuery } from "@tanstack/react-query";

import { getMySubmissions } from "../actions/get-my-submissions";
import { submissionKeys } from "../constants/submission.keys";

/**
 * A player's own submission history. Short staleTime rather than
 * TanStack's default of treating data as immediately stale — during a
 * live event a player will flip between a challenge page and their
 * submissions list repeatedly; a few seconds of staleness avoids
 * refetching on every mount without the data going noticeably out of
 * date. useSubmitFlag explicitly invalidates this on a correct
 * submission anyway, so staleness between explicit invalidations is the
 * only window this setting actually governs.
 */
export function useMySubmissions() {
  return useQuery({
    queryKey: submissionKeys.mine,
    queryFn: async () => {
      const result = await getMySubmissions();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    staleTime: 10_000,
  });
}
