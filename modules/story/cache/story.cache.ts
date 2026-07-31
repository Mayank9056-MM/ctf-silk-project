interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60_000;

/**
 * In-process cache for PUBLISHED story content — Chapter/Scene/Evidence
 * reads only, never StoryProgress or anything per-player. This is the
 * content/progress split from the domain design doc made concrete:
 * content is admin-authored, changes rarely, and gets read by every one
 * of 2,000+ players repeatedly through the event — exactly the data
 * worth keeping off the hot path to Postgres. Progress is per-user and
 * write-heavy and must never be cached this way.
 *
 * A plain in-memory Map, not Redis — same reasoning as choosing Postgres
 * over Redis for rate limiting: this app runs as a single, permanently-
 * running process (lib/prisma.ts's singleton pattern assumes exactly
 * that), so a process-local cache is correct today with zero new
 * infrastructure. See the multi-instance note below before this ever
 * runs as more than one process.
 */
class StoryCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  /**
   * Returns the cached value if present and unexpired; otherwise calls
   * `fetcher`, caches the result, and returns it. Not request-coalescing
   * — two concurrent calls arriving during the same cache-miss window
   * will both invoke `fetcher`, which briefly duplicates a DB read
   * rather than serializing callers behind a lock. Acceptable at this
   * scale (a handful of chapters/scenes, not a hot single row under
   * heavy write contention); a coalescing lock would be solving a
   * problem this data volume doesn't have.
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = DEFAULT_TTL_MS): Promise<T> {
    const cached = this.store.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const value = await fetcher();
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  /** Removes one specific key — call after an admin action changes exactly that content. */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Removes every key starting with `prefix` — for a change with a wider
   * blast radius than one row (reordering scenes within a chapter
   * invalidates every cached scene-list for that chapter, not one entry).
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Full flush — the safe default for any CMS write this module doesn't
   * have a narrower invalidation call wired up for yet. Story content is
   * small (a handful of chapters, a few dozen scenes for one event), so
   * a full rebuild-on-next-read costs nothing noticeable. Prefer
   * invalidate()/invalidatePrefix() where the blast radius is obvious;
   * reach for this when it isn't — under-invalidating and serving stale
   * content to a live player is the worse failure mode.
   */
  clear(): void {
    this.store.clear();
  }
}

export const storyCache = new StoryCache();

/**
 * Cache key builders, centralized. A typo'd inline string key
 * ("chapters:pub" vs "chapters:published") would silently create two
 * separate entries for what should be one — a much harder bug to spot
 * than a typo'd function name that fails to compile.
 */
export const storyCacheKeys = {
  publishedChapters: () => "chapters:published",
  chapterScenes: (chapterId: string) => `chapter:${chapterId}:scenes`,
  publishedScene: (sceneId: string) => `scene:${sceneId}:published`,
  publishedEvidence: (evidenceId: string) => `evidence:${evidenceId}:published`,
} as const;