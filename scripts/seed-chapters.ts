// ============================================================================
// seed-chapters.ts
// ============================================================================
//
// Owns Chapter rows ONLY. Split out from the original seed-story.ts
// specifically so anything with a chapterId FK (Scene, Challenge) has a
// real id to resolve against via chapter-map.ts, without this script
// knowing anything about scenes or challenges itself.
// ============================================================================

import prisma from "@/lib/prisma";
import { ContentStatus } from "@/app/generated/prisma/enums";
import "dotenv/config";

/**
 * Source-of-truth chapter list. Order 0 is the Prologue (docs/story/PROLOGUE.md),
 * which is content-complete per its own doc but was missing from the seed —
 * without it, storyNavigationService.getOrCreateProgress() would bootstrap
 * new players straight into Chapter 1 with no cold open.
 */
const CHAPTERS = [
  { number: 0, slug: "prologue", title: "Prologue: The Call" },
  { number: 1, slug: "chapter-1", title: "The Overdose" },
  { number: 2, slug: "chapter-2", title: "The Ledger" },
] as const;

export async function seedChapters(): Promise<void> {
  for (const chapter of CHAPTERS) {
    await prisma.chapter.upsert({
      where: { order: chapter.number },
      update: {
        slug: chapter.slug,
        title: chapter.title,
      },
      create: {
        slug: chapter.slug,
        title: chapter.title,
        order: chapter.number,
        status: ContentStatus.PUBLISHED,
      },
    });
  }

  console.log(`[seed-chapters] ${CHAPTERS.length} chapter(s) ready.`);
}

if (require.main === module) {
  seedChapters()
    .catch((error) => {
      console.error("[seed-chapters] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}