// ============================================================================
// seed-challenges.ts
// ============================================================================
//
// Owns Challenge, ChallengeAttachment, ChallengePrerequisite exclusively.
// Never writes Scene/Chapter/UnlockRule content — a CHALLENGE_GATE scene
// may reference a challengeId, but that FK existing doesn't make this
// script responsible for narrative content on either side of it.
//
// ASSUMPTION FLAGGED: real challenge titles/flags/points aren't in this
// conversation's context — CHALLENGE_CONTENT below demonstrates the
// pattern (chapter-number keyed, flag hashed at seed time, never stored
// plaintext) rather than real event content.
// ============================================================================

import prisma from "@/lib/prisma";
import { buildChapterMap } from "./utils/chapter-map";
import { hashFlag } from "@/modules/challenge/utils/hash-flag";
import "dotenv/config"

interface ChallengeSeed {
  slug: string;
  title: string;
  difficulty: number;
  displayOrder: number;
  flag: string; // Plaintext ONLY at seed-authoring time — hashed below before any write, matching flagHash's "never stored plaintext" invariant everywhere else in this codebase.
}

const CHALLENGE_CONTENT: Record<number, ChallengeSeed[]> = {
  1: [
    {
      slug: "the-overdose-report",
      title: "The Overdose Report",
      difficulty: 1,
      displayOrder: 1,
      flag: "SRCTF{first_thread}",
    },
  ],
};

/**
 * Challenges are upserted by the composite unique constraint
 * (chapterId, displayOrder) — see schema.prisma's
 * @@unique([chapterId, displayOrder]). The flag is re-hashed on every
 * run, so editing a flag in CHALLENGE_CONTENT and re-running this
 * script is the correct way to change a live flag before an event
 * starts (see CHALLENGE_FLAG_CHANGED's own severity in the audit
 * registry for why this must never happen casually once an event is live).
 */
export async function seedChallenges(): Promise<void> {
  const chapterMap = await buildChapterMap(prisma);

  for (const [chapterNumberStr, challenges] of Object.entries(
    CHALLENGE_CONTENT,
  )) {
    const chapterNumber = Number(chapterNumberStr);
    const chapterId = chapterMap.getId(chapterNumber);

    for (const challenge of challenges) {
      const flagHash = hashFlag(challenge.flag);

      await prisma.challenge.upsert({
        where: {
          chapterId_displayOrder: { chapterId, displayOrder: challenge.displayOrder },
        },
        update: {
          title: challenge.title,
          difficulty: challenge.difficulty,
          flagHash,
        },
        create: {
          chapterId,
          slug: challenge.slug,
          title: challenge.title,
          difficulty: challenge.difficulty,
          displayOrder: challenge.displayOrder,
          flagHash,
        },
      });
    }
  }

  console.log("[seed-challenges] Challenge content ready.");
}

if (require.main === module) {
  seedChallenges()
    .catch((error) => {
      console.error("[seed-challenges] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}