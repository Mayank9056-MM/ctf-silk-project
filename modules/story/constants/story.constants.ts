/**
 * Runtime tunables for the Story module. Centralizing cache TTLs here —
 * rather than leaving them as the hardcoded DEFAULT_TTL_MS buried inside
 * story-cache.ts — matches the same "one visible, tunable place"
 * convention as AUTH_CONSTANTS/RATE_LIMITS/LEADERBOARD_CONSTANTS
 * elsewhere in this build. A value that needs adjusting mid-event (e.g.
 * shortening the chapter-map TTL while an admin is actively publishing
 * new content) means editing one file, not hunting through
 * story.service.ts/evidence.service.ts.
 */
export const STORY_CONSTANTS = {
  /** How long a published-chapters list stays cached before re-fetching. */
  CHAPTER_MAP_CACHE_TTL_MS: 60_000,
  /** How long a single published-evidence lookup stays cached. */
  EVIDENCE_CACHE_TTL_MS: 60_000,
} as const;
