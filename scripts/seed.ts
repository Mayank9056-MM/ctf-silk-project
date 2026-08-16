// ============================================================================
// seed.ts
// ============================================================================
//
// Orchestration ONLY. No Prisma import, no business data.
//
// REORDERED from the previous chapters → story → challenges sequence.
// Scene now carries a real challengeId for CHALLENGE_GATE scenes, and
// UnlockRule carries real challenge ids for CHALLENGE_SOLVED conditions —
// both are seeded by seed-story.ts, so challenges must exist first.
// hints depend on challenges existing. admin must run before
// announcements (createdById needs a real SUPER_ADMIN). demo-progress
// depends on nearly everything else, so it runs last.
// ============================================================================

import prisma from "@/lib/prisma";
import { seedEvent } from "./seed-event";
import { seedChapters } from "./seed-chapters";
import { seedChallenges } from "./seed-challenges";
import { seedHints } from "./seed-hints";
import { seedStory } from "./seed-story";
import { seedUsers } from "./seed-users";
import { seedAdmin } from "./seed-admin";
import { seedAnnouncements } from "./seed-announcements";
import { seedDemoProgress } from "./seed-demo-progress";
import "dotenv/config";
import { seedChallengeAttachments } from "./seed-challenge-attachments";

interface SeedStep {
  name: string;
  run: () => Promise<void>;
}

const STEPS: SeedStep[] = [
  { name: "event", run: seedEvent },
  { name: "chapters", run: seedChapters },
  { name: "challenges", run: seedChallenges },
  { name: "challenge-attachments", run: seedChallengeAttachments },
  { name: "hints", run: seedHints },
  { name: "story", run: seedStory },
  { name: "users", run: seedUsers },
  { name: "admin", run: seedAdmin },
  { name: "announcements", run: seedAnnouncements },
  { name: "demo-progress", run: seedDemoProgress },
];

export async function main(): Promise<void> {
  for (const step of STEPS) {
    console.log(`\n[seed] → ${step.name}`);
    await step.run();
  }
  console.log("\n[seed] All steps completed.");
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error("\n[seed] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}