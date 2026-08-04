// ============================================================================
// seed.ts
// ============================================================================
//
// Orchestration ONLY. No Prisma import, no business data, no literal
// challenge title or chapter slug anywhere in this file — if either ever
// shows up here, that's the exact SRP violation the scripts/ redesign
// was meant to fix creeping back in.
//
// Sequencing follows the dependency graph: Event first (nothing depends
// on it, but every gated action needs it); Chapters before Story/
// Challenges (both need real chapterIds); Story and Challenges are
// independent of each other but run sequentially here for clearer
// failure logs; Users/Admin last, since seeding accounts before there's
// any content to test against is backwards in practice even though
// nothing enforces that ordering at the FK level.
// ============================================================================

import prisma from "@/lib/prisma";
import { seedEvent } from "./seed-event";
import { seedChapters } from "./seed-chapters";
import { seedStory } from "./seed-story";
import { seedChallenges } from "./seed-challenges";
import { seedUsers } from "./seed-users";
import { seedAdmin } from "./seed-admin";
import "dotenv/config";

interface SeedStep {
  name: string;
  run: () => Promise<void>;
}

const STEPS: SeedStep[] = [
  { name: "event", run: seedEvent },
  { name: "chapters", run: seedChapters },
  { name: "story", run: seedStory },
  { name: "challenges", run: seedChallenges },
  { name: "users", run: seedUsers },
  { name: "admin", run: seedAdmin },
];

/**
 * Runs every step sequentially, not in parallel — even where two steps
 * (story/challenges) have no FK dependency on each other, interleaved
 * console output from parallel scripts makes a failed run much harder
 * to diagnose than the small time cost of running them in order.
 * Stops at the first failure rather than continuing past it: a partial
 * seed with an unknown subset applied is worse than a clear "step 3 of
 * 6 failed" and a clean re-run (every step is upsert-based, so a re-run
 * from the top is always safe).
 */
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
