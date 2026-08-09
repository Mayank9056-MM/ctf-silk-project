import type { PlayerSearchQuery } from "../types/player-management.types";

export const playerManagementKeys = {
  /**
   * Root key. The real target for ban/unban/reset-password's
   * post-mutation invalidation — see the module-level cache strategy
   * note above for why a narrower, single-player invalidation would be
   * incorrect on its own, not just less thorough.
   */
  all: ["player-management"] as const,

  /**
   * One player, by id — backs useGetPlayer(playerId). Parameterized
   * because a different playerId is genuinely different, independently
   * cacheable data, the same reasoning challengeKeys.detail(slug) and
   * auditKeys.detail(id) already establish elsewhere in this project.
   */
  detail: (playerId: string) =>
    ["player-management", "detail", playerId] as const,

  /**
   * The paginated, optionally-filtered player list — backs
   * useGetPlayers(query). Every PlayerSearchQuery field that changes
   * the actual result set is decomposed into its own tuple position
   * (matching leaderboardKeys.page(page, pageSize)'s decomposed-
   * primitives style, not a single object reference), so two calls
   * with equal filter values always produce an equal, cache-hitting
   * key. `search`/`status` are normalized to `null` when omitted —
   * `undefined` vs. an omitted property can serialize inconsistently
   * across environments, while `null` is an explicit, stable "no
   * filter" marker in the tuple.
   */
  list: (query: PlayerSearchQuery) =>
    [
      "player-management",
      "list",
      query.search ?? null,
      query.status ?? null,
      query.page,
      query.pageSize,
    ] as const,
};
