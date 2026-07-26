/**
 * Internal-only — this must never become something a client can set (a
 * query param, a form field, a function argument taken from user input).
 * Which scope a request gets is decided entirely server-side in
 * LeaderboardService, from Event.leaderboardFrozenAt plus the caller's
 * role. If this enum ever ends up in a Zod schema or an action's public
 * parameter list, that's the freeze-bypass risk flagged last turn made
 * real — anyone could request LIVE directly and see through the freeze.
 */
export enum LeaderboardScope {
  LIVE = "LIVE",
  FROZEN = "FROZEN",
}
