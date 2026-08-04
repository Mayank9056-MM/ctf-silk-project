// ============================================================================
// seed-story.ts
// ============================================================================
//
// Owns narrative content exclusively: Scene, Character, DialogueLine,
// Choice, Evidence, UnlockRule. Does NOT create Chapters (seed-chapters.ts)
// or Challenges (seed-challenges.ts) — this is the SRP split the whole
// scripts/ redesign exists for.
//
// ASSUMPTION FLAGGED: actual scene/dialogue/character content (the real
// narrative text from docs/story/CHAPTER_01.md etc.) isn't available in
// this conversation's context — only the schema shape and this project's
// established seed conventions. STORY_CONTENT below is a minimal,
// structurally-correct placeholder demonstrating the pattern every real
// chapter's content should follow; replace its contents with the actual
// authored narrative before this script is used for anything beyond
// verifying the pipeline runs end-to-end.
// ============================================================================

import prisma from "@/lib/prisma";
import { ContentStatus, SceneType } from "@/app/generated/prisma/enums";
import { buildChapterMap } from "./utils/chapter-map";
import "dotenv/config"

interface SceneSeed {
  slug: string;
  title: string;
  type: SceneType;
  order: number;
}

/**
 * Keyed by chapter NUMBER (not id) — chapter-map.ts is what resolves
 * this to a real chapterId at write time. Adding a new chapter's
 * content here never requires knowing that chapter's generated id.
 */
const STORY_CONTENT: Record<number, SceneSeed[]> = {
  1: [
    { slug: "prologue", title: "The Call", type: SceneType.DIALOGUE, order: 1 },
    { slug: "the-file", title: "The File", type: SceneType.EVIDENCE_REVEAL, order: 2 },
  ],
  2: [
    { slug: "the-ledger", title: "The Ledger", type: SceneType.DIALOGUE, order: 1 },
  ],
};

/**
 * Scenes are upserted by the composite unique constraint
 * (chapterId, slug) — see schema.prisma's @@unique([chapterId, slug]).
 * Re-running this script updates existing scene content in place
 * rather than duplicating it.
 */
export async function seedStory(): Promise<void> {
  const chapterMap = await buildChapterMap(prisma);

  for (const [chapterNumberStr, scenes] of Object.entries(STORY_CONTENT)) {
    const chapterNumber = Number(chapterNumberStr);
    const chapterId = chapterMap.getId(chapterNumber);

for (const scene of scenes) {
  await prisma.scene.upsert({
    where: {
      chapterId_order: { chapterId, order: scene.order },
    },
    update: {
      slug: scene.slug,
      title: scene.title,
      type: scene.type,
    },
    create: {
      chapterId,
      slug: scene.slug,
      title: scene.title,
      type: scene.type,
      order: scene.order,
      status: ContentStatus.PUBLISHED,
    },
  });
}
  }

  console.log("[seed-story] Story content ready.");
}

if (require.main === module) {
  seedStory()
    .catch((error) => {
      console.error("[seed-story] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}