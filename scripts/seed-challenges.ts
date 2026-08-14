// ============================================================================
// seed-challenges.ts
// ============================================================================
//
// Owns Challenge, ChallengeAttachment, ChallengePrerequisite exclusively.
// Never writes Scene/Chapter/UnlockRule content.
//
// DEPENDENCY NOTE: this now runs BEFORE seed-story.ts, not after. Scene's
// CHALLENGE_GATE type carries a real challengeId, and UnlockRule rows of
// conditionType CHALLENGE_SOLVED carry a real challenge id as referenceId
// — both need this data to already exist. seed.ts's step order reflects
// that.
// ============================================================================

import prisma from "@/lib/prisma";
import { buildChapterMap } from "./utils/chapter-map";
import { hashFlag } from "@/modules/challenge/utils/hash-flag";
import "dotenv/config";

interface ChallengeSeed {
  slug: string;
  title: string;
  difficulty: number;
  displayOrder: number;
  xpReward: number;
  flag: string; // Plaintext ONLY at seed-authoring time — hashed below before any write.
  prerequisiteSlugs?: string[]; // Other challenges (same or earlier chapter) that must be solved first.
}

const CHALLENGE_CONTENT: Record<number, ChallengeSeed[]> = {
  0: [
    {
      slug: "the-pattern-tutorial",
      title: "A Pattern Nobody Saw",
      difficulty: 1,
      displayOrder: 1,
      xpReward: 50, // lower than Chapter 1's challenges — pure tutorial, not a real case
      flag: "SRCTF{pattern_nobody_saw}",
    },
  ],
  1: [
    {
      slug: "the-overdose-report",
      title: "The Overdose Report",
      difficulty: 1,
      displayOrder: 1,
      xpReward: 100,
      flag: "SRCTF{toxicology_never_lies}",
    },
    {
      slug: "burner-phone-forensics",
      title: "Burner Phone Forensics",
      difficulty: 2,
      displayOrder: 2,
      xpReward: 250,
      flag: "SRCTF{ping_tower_triangulation}",
      prerequisiteSlugs: ["the-overdose-report"],
    },
  ],
  2: [
    {
      slug: "the-wallet-ledger",
      title: "The Wallet Ledger",
      difficulty: 3,
      displayOrder: 1,
      xpReward: 400,
      flag: "SRCTF{same_wallet_three_buyers}",
    },
  ],
};

/**
 * Two passes: challenges first (so every slug→id resolves), then
 * ChallengePrerequisite rows — a prerequisite can reference a challenge
 * seeded later in iteration order within the same chapter, so this can't
 * be a single pass.
 */
export async function seedChallenges(): Promise<void> {
  const chapterMap = await buildChapterMap(prisma);
  const challengeIdBySlug = new Map<string, string>();

  for (const [chapterNumberStr, challenges] of Object.entries(
    CHALLENGE_CONTENT,
  )) {
    const chapterNumber = Number(chapterNumberStr);
    const chapterId = chapterMap.getId(chapterNumber);

    for (const challenge of challenges) {
      const flagHash = hashFlag(challenge.flag);

      const row = await prisma.challenge.upsert({
        where: {
          chapterId_displayOrder: {
            chapterId,
            displayOrder: challenge.displayOrder,
          },
        },
        update: {
          slug: challenge.slug,
          title: challenge.title,
          difficulty: challenge.difficulty,
          xpReward: challenge.xpReward,
          flagHash,
        },
        create: {
          chapterId,
          slug: challenge.slug,
          title: challenge.title,
          difficulty: challenge.difficulty,
          displayOrder: challenge.displayOrder,
          xpReward: challenge.xpReward,
          flagHash,
        },
      });

      challengeIdBySlug.set(challenge.slug, row.id);
    }
  }

  // Prerequisites — deleteMany + recreate per challenge rather than a
  // fragile upsert, since ChallengePrerequisite has no natural single-
  // column unique key beyond the composite (challengeId, prerequisiteId)
  // this script already knows in full each run.
  for (const challenges of Object.values(CHALLENGE_CONTENT)) {
    for (const challenge of challenges) {
      if (!challenge.prerequisiteSlugs?.length) continue;

      const challengeId = challengeIdBySlug.get(challenge.slug);
      if (!challengeId) continue;

      await prisma.challengePrerequisite.deleteMany({ where: { challengeId } });

      for (const prereqSlug of challenge.prerequisiteSlugs) {
        const prerequisiteId = challengeIdBySlug.get(prereqSlug);
        if (!prerequisiteId) {
          console.warn(
            `[seed-challenges] Skipping unknown prerequisite slug "${prereqSlug}" for "${challenge.slug}".`,
          );
          continue;
        }
        await prisma.challengePrerequisite.create({
          data: { challengeId, prerequisiteId },
        });
      }
    }
  }

  console.log(
    `[seed-challenges] ${challengeIdBySlug.size} challenge(s) ready across ${
      Object.keys(CHALLENGE_CONTENT).length
    } chapter(s).`,
  );
}

if (require.main === module) {
  seedChallenges()
    .catch((error) => {
      console.error("[seed-challenges] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
