"use client";

import { useQuery } from "@tanstack/react-query";
import { PlayerSearchQuery } from "../../types/player-management.types";
import { PlayerListDTO } from "../../types/player-management.dto";
import { playerManagementKeys } from "../../constants/player-management.keys";
import { getPlayers } from "../../actions/player-management/get-players";
import { PLAYER_MANAGEMENT_PAGINATION } from "../../constants/player-management.constants";

/**
 * Fetches one page of the Admin player-management list, optionally
 * filtered by search text and/or status.
 *
 * @param query - search/status/page/pageSize. `page` and `pageSize`
 * default the same way useAnnouncements' do — page defaults to 1,
 * pageSize defaults to this module's own pagination constant — so a
 * caller of this hook and a direct caller of getPlayersSchema agree on
 * what "not specified" means. ASSUMPTION FLAGGED:
 * PLAYER_MANAGEMENT_PAGINATION.DEFAULT_PAGE_SIZE is named by analogy
 * with ANNOUNCEMENT_PAGINATION.DEFAULT_PAGE_SIZE — I have not actually
 * seen player-management.constants.ts, so this constant's real name/
 * value needs confirming before this file will compile.
 *
 * queryKey is built via playerManagementKeys.list(query) — see that
 * file's own header for why every filterable field is decomposed into
 * the tuple rather than the query object being passed by reference.
 *
 * Returns the standard TanStack Query result object
 * (`data`/`isLoading`/`isError`/etc.) untouched. `data`, when present,
 * is exactly the PlayerListDTO the Server Action returned.
 *
 * No staleTime override, for the same reason usePlayer.ts doesn't set
 * one — a moderation-relevant list (who's currently banned) benefits
 * more from staying close to the queryClient's global default than
 * from copying useAnnouncements' 30_000, which was chosen for content
 * that's read often and changes rarely.
 */
export function usePlayers(query: PlayerSearchQuery) {
  const resolvedQuery: PlayerSearchQuery = {
    ...query,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? PLAYER_MANAGEMENT_PAGINATION.DEFAULT_PAGE_SIZE,
  };

  return useQuery<PlayerListDTO>({
    queryKey: playerManagementKeys.list(resolvedQuery),
    queryFn: () => getPlayers(resolvedQuery),
  });
}