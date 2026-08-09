"use client";

import { useQuery } from "@tanstack/react-query";
import { PlayerDTO } from "../../types/player-management.dto";
import { playerManagementKeys } from "../../constants/player-management.keys";
import { getPlayer } from "../../actions/player-management/get-player";

/**
 * Fetches a single player for the Admin player-management detail view.
 *
 * @param playerId - The player to fetch. May be `undefined` (e.g. no
 * row selected yet in the admin panel) — the query is disabled until a
 * real id is provided, matching `useQuery`'s standard `enabled` guard
 * rather than forcing every call site to conditionally call this hook
 * at all. ASSUMPTION FLAGGED: no existing single-item-by-id query hook
 * was available to confirm this is the project's established pattern
 * for a possibly-absent id — only list (`useAnnouncements`) and create
 * (`useCreateAnnouncement`) hooks were shown. If this project instead
 * expects every call site to only mount the hook once an id is known,
 * drop the `enabled` guard and make `playerId` a required `string`.
 *
 * Returns the standard TanStack Query result object
 * (`data`/`isLoading`/`isError`/etc.) untouched. `data`, when present,
 * is exactly the PlayerDTO the Server Action returned.
 *
 * No default staleTime override beyond what queryClient's own global
 * default provides — 30_000 was `useAnnouncements`'s own explicit
 * choice for a list that's read often and changes rarely; a single
 * player's ban/unban/reset status is exactly what an admin acting on
 * this same row needs to see reflected promptly, so this hook doesn't
 * copy that same staleTime without a matching reason to.
 */
export function usePlayer(playerId: string | undefined) {
  return useQuery<PlayerDTO>({
    queryKey: playerManagementKeys.detail(playerId ?? ""),
    queryFn: () => getPlayer(playerId as string),
    enabled: Boolean(playerId),
  });
}
