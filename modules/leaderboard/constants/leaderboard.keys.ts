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
};