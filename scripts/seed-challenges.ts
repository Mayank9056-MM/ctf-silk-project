// scripts/seed-challenges.ts
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
//
// DESCRIPTION CONTENT NOTE (this pass): every challenge below now carries
// a `description` — the narrative briefing text ChallengeObjective
// renders on the player-facing challenge page. Same status as Chapter
// 1/2's scene dialogue in seed-story.ts: NOT sourced from
// docs/story/CHALLENGES.md (I don't have that file's contents), written
// now in matching noir-investigative tone, and should be treated as
// placeholder until real authored copy replaces it. This includes
// "the-pattern-tutorial" even though it belongs to the doc-sourced
// Prologue chapter — PROLOGUE.md's own "the-pattern" scene has generic
// dialogue but no separately authored challenge-briefing text to pull
// this from.
// ============================================================================

import prisma from "@/lib/prisma";
import { buildChapterMap } from "./utils/chapter-map";
import { hashFlag } from "@/modules/challenge/utils/hash-flag";
import "dotenv/config";

export interface ChallengeSeed {
  slug: string;
  title: string;
  description: string;
  difficulty: number;
  displayOrder: number;
  xpReward: number;
  flag: string; // Plaintext ONLY at seed-authoring time — hashed below before any write.
  prerequisiteSlugs?: string[]; // Other challenges (same or earlier chapter) that must be solved first.
}

export const CHALLENGE_CONTENT: Record<number, ChallengeSeed[]> = {
  0: [
    {
      slug: "the-pattern-tutorial",
      title: "A Pattern Nobody Saw",
      description:
        "The case files sprawl across your desk — dozens of overdose reports from a dozen different cities. On paper, they're unconnected. But something about the wallet addresses keeps repeating. Cross-reference what the summaries left out, and see if a pattern survives the noise.",
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
      description:
        "The toxicology report sits open under the desk lamp. Officially, this was an accident — a synthetic contamination, nothing more. But the timeline in the header doesn't line up with the 911 call. Read the numbers literally. Find where the official story stops matching the evidence.",
      difficulty: 1,
      displayOrder: 1,
      xpReward: 100,
      flag: "SRCTF{toxicology_never_lies}",
    },
    {
      slug: "burner-phone-forensics",
      title: "Burner Phone Forensics",
      description:
        "A cheap burner phone, wiped down but not wiped clean. The SIM is gone, but the carrier's tower logs survived the attempt to erase it. Triangulate the pings — three points is all you need — and place whoever was carrying this phone at the moment it mattered most.",
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
      description:
        "One wallet address. Three separate buyers. Six hours between the first transaction and the last. On the surface, three unrelated deals — but the ledger doesn't know how to lie. Trace every transaction back to its source and prove they all point to the same hand.",
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

  for (const [chapterNumberStr, challenges] of Object.entries(CHALLENGE_CONTENT)) {
    const chapterNumber = Number(chapterNumberStr);
    const chapterId = chapterMap.getId(chapterNumber);

    for (const challenge of challenges) {
      const flagHash = hashFlag(challenge.flag);

      const row = await prisma.challenge.upsert({
        where: {
          chapterId_displayOrder: { chapterId, displayOrder: challenge.displayOrder },
        },
        update: {
          slug: challenge.slug,
          title: challenge.title,
          description: challenge.description,
          difficulty: challenge.difficulty,
          xpReward: challenge.xpReward,
          flagHash,
        },
        create: {
          chapterId,
          slug: challenge.slug,
          title: challenge.title,
          description: challenge.description,
          difficulty: challenge.difficulty,
          displayOrder: challenge.displayOrder,
          xpReward: challenge.xpReward,
          flagHash,
        },
      });

      challengeIdBySlug.set(challenge.slug, row.id);
    }
  }

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
        await prisma.challengePrerequisite.create({ data: { challengeId, prerequisiteId } });
      }
    }
  }

  console.log(
    `[seed-challenges] ${challengeIdBySlug.size} challenge(s) ready across ${Object.keys(CHALLENGE_CONTENT).length} chapter(s).`,
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