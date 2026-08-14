export const storyKeys = {
  chapterMap: ["story", "chapter-map"] as const,
  currentScene: ["story", "current-scene"] as const,
  progress: ["story", "progress"] as const,

  replayScene: (sceneId: string) => ["story", "replay-scene", sceneId] as const,

  /**
   * New — evidenceService.getEvidenceBoard(userId) is chapter-scoped and
   * derives its subject from the caller's own session (same "implicitly
   * scoped to the caller" reasoning the header comment on this file
   * already states for chapterMap/currentScene/progress), so no chapterId
   * parameter is threaded through the key — there's exactly one board per
   * authenticated player at any given time, matching the service's own
   * "always the CURRENT chapter" contract.
   */
  evidenceBoard: ["story", "evidence-board"] as const,

  /**
   * New — parameterized by evidenceId, same reasoning as replayScene:
   * genuinely varies per item requested, so each is independently
   * cacheable rather than sharing one key.
   */
  evidence: (evidenceId: string) => ["story", "evidence", evidenceId] as const,

  /** New — one history per authenticated player, same "implicitly scoped to the caller" reasoning as chapterMap/currentScene/progress. */
  history: ["story", "history"] as const,
} as const;

