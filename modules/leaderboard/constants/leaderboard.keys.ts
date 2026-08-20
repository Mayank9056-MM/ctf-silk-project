/**
 * All leaderboard/rank data is scoped implicitly to "the current event" —
 * there's exactly one Event row (see the singleton pattern), so unlike
 * challengeKeys.detail(slug), no eventId needs to appear in any key here.
 */
export const leaderboardKeys = {
  /**
   * Parameterized by page/pageSize, matching challengeKeys.detail's
   * pattern — different pages are genuinely different, independently
   * cacheable data, not the same query with different arguments thrown
   * away.
   */
  page: (page: number, pageSize: number) =>
    ["leaderboard", "page", page, pageSize] as const,

  myRank: ["leaderboard", "my-rank"] as const,

  userRank: (userId: string) => ["leaderboard", "user-rank", userId] as const,

  /**
   * ADDED for the Admin dashboard's leaderboard panel. Deliberately a
   * separate top-level branch ("admin", not nested under "page") —
   * admin rows carry email and are never subject to the frozen/live
   * split the player-facing `page` key's data is, so treating them as
   * the same cache entry space would be incorrect: freezing/unfreezing
   * must invalidate this key without ever being confused with the
   * player-facing `page` cache, and vice versa.
   */
  admin: (page: number, pageSize: number) =>
    ["leaderboard", "admin", page, pageSize] as const,
};
