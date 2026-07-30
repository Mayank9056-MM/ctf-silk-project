/**
 * TanStack Query key registry for the Story module. All three fixed keys
 * are implicitly scoped to "the caller's own session" — same as
 * submissionKeys.mine and leaderboardKeys.myRank — since every read
 * action (getChapterMap, getCurrentScene, getStoryProgress) derives its
 * subject from requireAuth(), never a client-supplied userId.
 */
export const storyKeys = {
  chapterMap: ["story", "chapter-map"] as const,
  currentScene: ["story", "current-scene"] as const,
  progress: ["story", "progress"] as const,

  /**
   * Parameterized by sceneId, unlike the three above — a replayed scene
   * genuinely varies per scene requested, so each is independently
   * cacheable, matching challengeKeys.detail(slug)'s pattern rather than
   * currentScene's single fixed key.
   */
  replayScene: (sceneId: string) => ["story", "replay-scene", sceneId] as const,
};