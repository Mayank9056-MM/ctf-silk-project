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
import "dotenv/config"

/**
 * Source-of-truth chapter list. Kept as plain data here rather than
 * parsed from docs/story/*.md at seed time — parsing markdown for
 * structural data (title, order) would make this script's success
 * depend on prose formatting staying stable, which is a documentation
 * concern, not a seeding one. The docs remain the narrative source
 * material a human author works from; this array is what actually
 * gets persisted.
 */
const CHAPTERS = [
  { number: 1, slug: "chapter-1", title: "The Overdose" },
  { number: 2, slug: "chapter-2", title: "The Ledger" },
] as const;

/**
 * Upsert by slug — re-running this script updates title/order on
 * existing chapters without ever creating a duplicate or touching
 * their generated id, which is exactly the stability chapter-map.ts
 * depends on.
 */
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