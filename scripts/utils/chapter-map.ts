// ============================================================================
// utils/chapter-map.ts
// ============================================================================
//
// Bridges "chapter number" (how docs/story/*.md and every seed script
// naturally refer to content — "Chapter 1", "Chapter 2") to the real
// database foreign key, Chapter.id, without ever hardcoding a UUID in a
// seed file.
//
// WHY THIS EXISTS
// Challenge.chapterId (and Scene.chapterId) used to be a bare `Int` —
// safe to hardcode, because the number WAS the content. After the FK
// migration, chapterId is a Postgres-generated id that doesn't exist
// until seed-chapters.ts has actually run, and is DIFFERENT on every
// fresh database (dev, CI, a teammate's machine, a wiped staging DB).
// Hardcoding one would mean the seed only ever works against the one
// database it was copied from.
//
// This file queries Chapter exactly once per seed run and builds an
// in-memory lookup. Every downstream seed script (seed-story.ts,
// seed-challenges.ts) asks this map for an id instead of ever writing
// one — the same "resolve once, trust everywhere after" discipline as
// audit.mapper.ts's EVENT_DEFINITIONS_BY_ACTION index.
// ============================================================================

import type { DbClient } from "@/lib/prisma";

export interface ChapterMap {
  /** Throws if `chapterNumber` has no corresponding seeded Chapter — a missing entry here is a seed-ordering bug, never a value to silently skip. */
  getId(chapterNumber: number): string;
  /** True set of chapter numbers currently resolvable — useful for a seed script to validate its own content data before writing anything. */
  readonly chapterNumbers: ReadonlySet<number>;
}

/**
 * Chapter.slug is expected in the form "chapter-N" (matching
 * docs/story/CHAPTER_01.md-style numbering) — this is the ONE place
 * that convention is decoded, so if the slug format ever changes,
 * exactly one function needs to change, not every seed script that
 * reads a chapter number.
 */
const CHAPTER_SLUG_PATTERN = /^chapter-(\d+)$/;

/**
 * Chapter.slug is expected in the form "chapter-N" (matching
 * docs/story/CHAPTER_01.md-style numbering), with one deliberate
 * exception: "prologue" resolves to chapter number 0. The Prologue is
 * numbered zero throughout this codebase (seed-chapters.ts's own
 * CHAPTERS array, the domain docs distinguishing PROLOGUE.md from
 * CHAPTER_01.md) but its slug is deliberately NOT "chapter-0" — a
 * player-facing route like /story/chapters/chapter-0 would leak the
 * numbering convention into a URL where /story/chapters/prologue reads
 * naturally instead.
 */
function parseChapterNumber(slug: string): number | null {
  if (slug === "prologue") return 0;

  const match = CHAPTER_SLUG_PATTERN.exec(slug);
  return match ? Number.parseInt(match[1], 10) : null;
}

/**
 * Builds the chapter-number → Chapter.id map for this seed run. Called
 * once per script invocation, immediately after seed-chapters.ts has
 * run (or, when run standalone, against whatever chapters already
 * exist in the target database) — never cached across separate `tsx`
 * process invocations, since each seed script run is short-lived and a
 * stale cross-run cache would be a correctness risk with zero
 * performance benefit.
 */
export async function buildChapterMap(db: DbClient): Promise<ChapterMap> {
  const chapters = await db.chapter.findMany({
    select: { id: true, slug: true },
  });

  const idByNumber = new Map<number, string>();

  for (const chapter of chapters) {
    const chapterNumber = parseChapterNumber(chapter.slug);
    if (chapterNumber === null) {
      // A chapter exists with a slug this map can't decode. Not fatal —
      // some future chapter might legitimately use a non-numeric slug
      // — but silently ignoring it would make a later "chapter N not
      // found" error confusing to debug, so it's surfaced now instead.
      console.warn(
        `[chapter-map] Chapter "${chapter.slug}" does not match the "chapter-N" convention and will not be resolvable by number.`,
      );
      continue;
    }
    idByNumber.set(chapterNumber, chapter.id);
  }

  return {
    getId(chapterNumber: number): string {
      const id = idByNumber.get(chapterNumber);
      if (!id) {
        throw new Error(
          `[chapter-map] No seeded Chapter found for chapter number ${chapterNumber}. Run seed-chapters.ts before this script.`,
        );
      }
      return id;
    },
    chapterNumbers: new Set(idByNumber.keys()),
  };
}