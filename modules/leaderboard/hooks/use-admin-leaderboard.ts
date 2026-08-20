"use client";

import { useQuery } from "@tanstack/react-query";
import { LEADERBOARD_CONSTANTS } from "../constants/leaderboard.constants";
import { leaderboardKeys } from "../constants/leaderboard.keys";
import { getAdminLeaderboard } from "../actions/get-admin-leaderboard";
import type { AdminLeaderboardDTO } from "../types/leaderboard.dto";

/**
 * Backs the Admin > Leaderboard panel. Polls at
 * LEADERBOARD_CONSTANTS.POLL_INTERVAL_MS — the same interval the
 * player-facing board already uses — since standings during a live
 * event are exactly the kind of data an admin needs to see update
 * without a manual refresh.
 */
export function useAdminLeaderboard(
  page: number = 1,
  pageSize: number = LEADERBOARD_CONSTANTS.DEFAULT_PAGE_SIZE,
) {
  return useQuery<AdminLeaderboardDTO>({
    queryKey: leaderboardKeys.admin(page, pageSize),
    queryFn: () => getAdminLeaderboard({ page, pageSize }),
    refetchInterval: LEADERBOARD_CONSTANTS.POLL_INTERVAL_MS,
  });
}
