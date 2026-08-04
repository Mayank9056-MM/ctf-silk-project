// Run with: npm run seed:challenges
// package.json: "seed:challenges": "tsx --env-file=.env scripts/seed-challenges.ts"
//
// Edit ONLY the CHALLENGES array below. Slugs are the stable identity this
// script upserts on — once real players have solved something, treat its
// slug as permanent. Safe to re-run any number of times: existing rows get
// updated in place, nothing is ever deleted by this script.

import prisma from "@/lib/prisma";
import { hashFlag } from "@/modules/challenge/utils/hash-flag";
import { submitFlagSchema } from "@/modules/submission/validations/submit-flag.schema";
import { CHALLENGE_DIFFICULTY } from "@/modules/challenge/constants/challenge.constants";

interface ChallengeSeed {
  slug: string;
  title: string;
  chapterId: string;
  /** Position within its chapter — unique per chapter, starting at 1. */
  displayOrder: number;
  difficulty: number;
  xpReward: number;
  /**
   * Plaintext, here only. Never stored as-is — hashed below before any
   * database write, and validated against the real live submission
   * format first (see validateChallenges).
   */
  flag: string;
  /** Slugs of challenges that must be solved before this one unlocks. */
  prerequisites?: string[];
}

const CHALLENGES: ChallengeSeed[] = [
  // ---------------------------------------------------------------
  // Chapter 1 — Prologue
  // ---------------------------------------------------------------
  {
    slug: "closed-case-file",
    title: "The Closed Case File",
    chapterId: "1",
    displayOrder: 1,
    difficulty: CHALLENGE_DIFFICULTY.EASY,
    xpReward: 100,
    flag: "ctf{no_further_investigation}",
  },
  {
    slug: "first-inconsistency",
    title: "First Inconsistency",
    chapterId: "1",
    displayOrder: 2,
    difficulty: CHALLENGE_DIFFICULTY.EASY,
    xpReward: 100,
    flag: "ctf{same_chemical_signature}",
    prerequisites: ["closed-case-file"],
  },

  // ---------------------------------------------------------------
  // Chapter 2 — First Lead
  // ---------------------------------------------------------------
  {
    slug: "the-wallet-trail",
    title: "The Wallet Trail",
    chapterId: "2",
    displayOrder: 1,
    difficulty: CHALLENGE_DIFFICULTY.MEDIUM,
    xpReward: 150,
    flag: "ctf{same_wallet_three_cities}",
    prerequisites: ["first-inconsistency"],
  },
  {
    slug: "encrypted-channel",
    title: "The Encrypted Channel",
    chapterId: "2",
    displayOrder: 2,
    difficulty: CHALLENGE_DIFFICULTY.MEDIUM,
    xpReward: 150,
    flag: "ctf{ferryman88}",
    prerequisites: ["first-inconsistency"],
  },
  {
    slug: "three-cities-one-thread",
    title: "Three Cities, One Thread",
    chapterId: "2",
    displayOrder: 3,
    difficulty: CHALLENGE_DIFFICULTY.MEDIUM,
    xpReward: 175,
    flag: "ctf{one_organization}",
    prerequisites: ["the-wallet-trail", "encrypted-channel"],
  },

  // ---------------------------------------------------------------
  // Chapter 3 — Hidden Marketplace
  // ---------------------------------------------------------------
  {
    slug: "mirrored-market",
    title: "The Mirrored Marketplace",
    chapterId: "3",
    displayOrder: 1,
    difficulty: CHALLENGE_DIFFICULTY.MEDIUM,
    xpReward: 175,
    flag: "ctf{silk_road_mirror_active}",
    prerequisites: ["three-cities-one-thread"],
  },
  {
    slug: "vendor-metadata-leak",
    title: "Vendor Metadata Leak",
    chapterId: "3",
    displayOrder: 2,
    difficulty: CHALLENGE_DIFFICULTY.MEDIUM,
    xpReward: 175,
    flag: "ctf{gps_tag_left_behind}",
    prerequisites: ["mirrored-market"],
  },
  {
    slug: "hidden-upload-folder",
    title: "The Hidden Upload Folder",
    chapterId: "3",
    displayOrder: 3,
    difficulty: CHALLENGE_DIFFICULTY.HARD,
    xpReward: 200,
    flag: "ctf{robots_txt_lied}",
    prerequisites: ["mirrored-market"],
  },

  // ---------------------------------------------------------------
  // Chapter 4 — Crypto Trail / Dark Web
  // ---------------------------------------------------------------
  {
    slug: "mixer-hop-trace",
    title: "Tracing the Mixer",
    chapterId: "4",
    displayOrder: 1,
    difficulty: CHALLENGE_DIFFICULTY.HARD,
    xpReward: 200,
    flag: "ctf{three_hops_one_exchange}",
    prerequisites: ["vendor-metadata-leak", "hidden-upload-folder"],
  },
  {
    slug: "onion-service-recon",
    title: "Onion Service Recon",
    chapterId: "4",
    displayOrder: 2,
    difficulty: CHALLENGE_DIFFICULTY.HARD,
    xpReward: 225,
    flag: "ctf{shadowfx_onion}",
    prerequisites: ["mixer-hop-trace"],
  },
  {
    slug: "brute-the-vault",
    title: "Brute the Vault",
    chapterId: "4",
    displayOrder: 3,
    difficulty: CHALLENGE_DIFFICULTY.HARD,
    xpReward: 225,
    flag: "ctf{weak_passphrase_reused}",
    prerequisites: ["onion-service-recon"],
  },

  // ---------------------------------------------------------------
  // Chapter 5 — Warehouse / Internal Corruption
  // ---------------------------------------------------------------
  {
    slug: "warehouse-logs",
    title: "Warehouse Access Logs",
    chapterId: "5",
    displayOrder: 1,
    difficulty: CHALLENGE_DIFFICULTY.HARD,
    xpReward: 250,
    flag: "ctf{badge_scan_at_0214}",
    prerequisites: ["brute-the-vault"],
  },
  {
    slug: "the-informant",
    title: "The Informant Inside",
    chapterId: "5",
    displayOrder: 2,
    difficulty: CHALLENGE_DIFFICULTY.EXPERT,
    xpReward: 275,
    flag: "ctf{senior_agent_was_the_leak}",
    prerequisites: ["warehouse-logs"],
  },

  // ---------------------------------------------------------------
  // Chapter 6 — Cartel Structure / Robert
  // ---------------------------------------------------------------
  {
    slug: "the-org-chart",
    title: "Reconstructing the Org Chart",
    chapterId: "6",
    displayOrder: 1,
    difficulty: CHALLENGE_DIFFICULTY.EXPERT,
    xpReward: 300,
    flag: "ctf{recruiters_developers_distributors}",
    prerequisites: ["the-informant"],
  },
  {
    slug: "who-is-robert",
    title: "Who Is Robert?",
    chapterId: "6",
    displayOrder: 2,
    difficulty: CHALLENGE_DIFFICULTY.EXPERT,
    xpReward: 350,
    flag: "ctf{robert_was_never_his_name}",
    prerequisites: ["the-org-chart"],
  },
];

// ===================================================================
// Validation — runs BEFORE any database write, so a typo in the data
// above fails loudly and immediately rather than leaving a half-seeded
// database.
// ===================================================================

function validateChallenges(challenges: ChallengeSeed[]): void {
  const errors: string[] = [];
  const slugs = new Set(challenges.map((c) => c.slug));

  if (slugs.size !== challenges.length) {
    errors.push(
      "Duplicate slug detected — every challenge needs a unique slug.",
    );
  }

  const chapterOrderKeys = new Set<string>();
  for (const challenge of challenges) {
    const key = `${challenge.chapterId}:${challenge.displayOrder}`;
    if (chapterOrderKeys.has(key)) {
      errors.push(
        `Duplicate (chapter, displayOrder) for "${challenge.slug}": chapter ${challenge.chapterId}, order ${challenge.displayOrder}.`,
      );
    }
    chapterOrderKeys.add(key);

    for (const prereqSlug of challenge.prerequisites ?? []) {
      if (!slugs.has(prereqSlug)) {
        errors.push(
          `"${challenge.slug}" lists unknown prerequisite slug "${prereqSlug}".`,
        );
      }
      if (prereqSlug === challenge.slug) {
        errors.push(`"${challenge.slug}" cannot be its own prerequisite.`);
      }
    }

    // Reuse the REAL production flag validator/normalizer — the same
    // schema a live submission goes through. A flag that fails here
    // would also be unsubmittable by an actual player.
    const parsedFlag = submitFlagSchema.shape.flag.safeParse(challenge.flag);
    if (!parsedFlag.success) {
      errors.push(
        `"${challenge.slug}" has an invalid flag format: ${parsedFlag.error.issues[0]?.message}`,
      );
    }
  }

  if (errors.length > 0) {
    console.error("❌ Challenge seed data is invalid:\n");
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
}

// ===================================================================
// Seed
// ===================================================================

async function seedChallenges(): Promise<void> {
  validateChallenges(CHALLENGES);

  const summary = { created: 0, updated: 0 };

  await prisma.$transaction(async (tx) => {
    // Pass 1 — upsert every challenge row first, so every slug has a
    // known id before pass 2 wires up prerequisites between them.
    const idBySlug = new Map<string, string>();

    for (const challenge of CHALLENGES) {
      const normalizedFlag = submitFlagSchema.shape.flag.parse(challenge.flag);
      const flagHash = hashFlag(normalizedFlag);

      const existing = await tx.challenge.findUnique({
        where: { slug: challenge.slug },
        select: { id: true },
      });

      const record = await tx.challenge.upsert({
        where: { slug: challenge.slug },
        update: {
          title: challenge.title,
          chapterId: challenge.chapterId,
          displayOrder: challenge.displayOrder,
          difficulty: challenge.difficulty,
          xpReward: challenge.xpReward,
          flagHash,
        },
        create: {
          slug: challenge.slug,
          title: challenge.title,
          chapterId: challenge.chapterId,
          displayOrder: challenge.displayOrder,
          difficulty: challenge.difficulty,
          xpReward: challenge.xpReward,
          flagHash,
        },
        select: { id: true },
      });

      idBySlug.set(challenge.slug, record.id);
      existing ? summary.updated++ : summary.created++;
    }

    // Pass 2 — replace each challenge's prerequisite links wholesale.
    // Simpler and safer than diffing for a hand-authored list this size:
    // clear, then recreate exactly what's declared above.
    for (const challenge of CHALLENGES) {
      const challengeId = idBySlug.get(challenge.slug)!;

      await tx.challengePrerequisite.deleteMany({ where: { challengeId } });

      const prerequisites = challenge.prerequisites ?? [];
      if (prerequisites.length === 0) continue;

      await tx.challengePrerequisite.createMany({
        data: prerequisites.map((prereqSlug) => ({
          challengeId,
          prerequisiteId: idBySlug.get(prereqSlug)!,
        })),
      });
    }
  });

  console.log(`✅ Seeded ${CHALLENGES.length} challenges`);
  console.log(`   ${summary.created} created, ${summary.updated} updated`);
  console.log(
    `   Total XP available: ${CHALLENGES.reduce((sum, c) => sum + c.xpReward, 0)}`,
  );

  if (process.env.NODE_ENV !== "production") {
    console.log(
      "\n🚩 Flags (dev/testing only — never let this log in production):\n",
    );
    for (const challenge of CHALLENGES) {
      console.log(`   ${challenge.slug.padEnd(28)} ${challenge.flag}`);
    }
  }
}

seedChallenges()
  .catch((error) => {
    console.error("❌ Failed to seed challenges");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
