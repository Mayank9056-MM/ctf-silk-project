import { useQuery } from "@tanstack/react-query";

import { getUserRank } from "../actions/get-user-rank";
import { leaderboardKeys } from "../constants/leaderboard.keys";
import { LEADERBOARD_CONSTANTS } from "../constants/leaderboard.constants";

/**
 * `enabled: Boolean(userId)` — same pattern as useChallenge(slug) in the
 * challenge module: this hook is meant for a profile-style view reached
 * via navigation (e.g. clicking a name on the leaderboard), so it needs
 * to tolerate mounting before a real userId is available yet, not fire a
 * request for `undefined`.
 */
export function useUserRank(userId: string | undefined) {
  return useQuery({
    queryKey: leaderboardKeys.userRank(userId ?? ""),
    queryFn: async () => {
      const result = await getUserRank(userId!);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    enabled: Boolean(userId),
    refetchInterval: (query) =>
      query.state.data?.isFrozen ? false : LEADERBOARD_CONSTANTS.POLL_INTERVAL_MS,
  });
}