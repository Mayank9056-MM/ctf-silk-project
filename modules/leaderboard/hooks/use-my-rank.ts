import { useQuery } from "@tanstack/react-query";

import { getMyRank } from "../actions/get-my-rank";
import { leaderboardKeys } from "../constants/leaderboard.keys";
import { LEADERBOARD_CONSTANTS } from "../constants/leaderboard.constants";

/**
 * Same freeze-aware polling as useLeaderboard. This is the hook most
 * likely to sit persistently visible in a HUD ("Your rank: #7") rather
 * than only on a dedicated leaderboard page, so stopping polling on
 * freeze matters even more here — it's the one query most likely to be
 * mounted continuously for the entire second half of the event.
 */
export function useMyRank() {
  return useQuery({
    queryKey: leaderboardKeys.myRank,
    queryFn: async () => {
      const result = await getMyRank();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    refetchInterval: (query) =>
      query.state.data?.isFrozen ? false : LEADERBOARD_CONSTANTS.POLL_INTERVAL_MS,
  });
}