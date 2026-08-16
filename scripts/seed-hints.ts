// ============================================================================
// seed-hints.ts
// ============================================================================
//
// Owns Hint rows exclusively (never PlayerHint — per-player unlock state
// belongs to a demo/progress script, not this one).
//
// CORRECTED against schema.prisma: Hint is NOT (challengeId, order, content,
// cost) as first drafted — it's (challengeId, title, content, level: HintLevel,
// xpCost, status: ContentStatus), unique on (challengeId, level). Rewritten
// to match.
// ============================================================================

import prisma from "@/lib/prisma";
import { ContentStatus, HintLevel } from "@/app/generated/prisma/enums";
import "dotenv/config";

interface HintSeed {
  challengeSlug: string;
  level: HintLevel;
  title: string;
  content: string;
  xpCost: number;
}

const HINT_CONTENT: HintSeed[] = [
   {
    challengeSlug: "the-pattern-tutorial",
    level: HintLevel.LEVEL_1,
    title: "Two files, one wallet",
    content: "Two of the case files reference the same wallet address under different formatting — normalize before you compare.",
    xpCost: 0,
  },
  {
    challengeSlug: "the-overdose-report",
    level: HintLevel.LEVEL_1,
    title: "Check the timeline",
    content: "Compare the timestamps in the report header against the 911 call log.",
    xpCost: 10,
  },
  {
    challengeSlug: "the-overdose-report",
    level: HintLevel.LEVEL_2,
    title: "Read the toxicology numbers literally",
    content: "The flag format is SRCTF{...} — look at what the toxicology results actually confirmed, not what the summary claims.",
    xpCost: 25,
  },
  {
    challengeSlug: "burner-phone-forensics",
    level: HintLevel.LEVEL_1,
    title: "Three points is enough",
    content: "Cell tower triangulation only needs three data points, not GPS.",
    xpCost: 20,
  },
  {
    challengeSlug: "the-wallet-ledger",
    level: HintLevel.LEVEL_1,
    title: "Look past the first two",
    content: "Compare wallet addresses across all three transactions, not just the first two.",
    xpCost: 30,
  },
];

export async function seedHints(): Promise<void> {
  let seeded = 0;

  for (const hint of HINT_CONTENT) {
    const challenge = await prisma.challenge.findUnique({
      where: { slug: hint.challengeSlug },
      select: { id: true },
    });

    if (!challenge) {
      console.warn(
        `[seed-hints] Skipping hint — no challenge found for slug "${hint.challengeSlug}". Did seed-challenges run first?`,
      );
      continue;
    }

    await prisma.hint.upsert({
      where: {
        challengeId_level: { challengeId: challenge.id, level: hint.level },
      },
      update: {
        title: hint.title,
        content: hint.content,
        xpCost: hint.xpCost,
        status: ContentStatus.PUBLISHED,
      },
      create: {
        challengeId: challenge.id,
        level: hint.level,
        title: hint.title,
        content: hint.content,
        xpCost: hint.xpCost,
        status: ContentStatus.PUBLISHED,
      },
    });

    seeded += 1;
  }

  console.log(`[seed-hints] ${seeded} hint(s) ready.`);
}

if (require.main === module) {
  seedHints()
    .catch((error) => {
      console.error("[seed-hints] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}