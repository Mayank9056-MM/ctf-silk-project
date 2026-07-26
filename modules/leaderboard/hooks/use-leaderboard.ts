import { useQuery } from "@tanstack/react-query";

import { getLeaderboard } from "../actions/get-leaderboard";
import { leaderboardKeys } from "../constants/leaderboard.keys";
import { LEADERBOARD_CONSTANTS } from "../constants/leaderboard.constants";

/**
 * Polls while the board is live, stops entirely once it's frozen —
 * `refetchInterval` reads the *previous* response's `isFrozen` flag to
 * decide whether the *next* fetch should happen at all. Standings can't
 * change after a freeze, so continuing to poll would just be wasted
 * requests during exactly the tense, high-traffic moment (right before
 * winners are decided) when server load matters most.
 */
export function useLeaderboard(page: number, pageSize: number) {
  return useQuery({
    queryKey: leaderboardKeys.page(page, pageSize),
    queryFn: async () => {
      const result = await getLeaderboard(page, pageSize);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    refetchInterval: (query) =>
      query.state.data?.isFrozen ? false : LEADERBOARD_CONSTANTS.POLL_INTERVAL_MS,
  });
}