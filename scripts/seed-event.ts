// ============================================================================
// seed-event.ts
// ============================================================================
//
// Seeds the Event singleton row. Every gated action on the platform
// (eventService.getEventAccess) throws NOT_FOUND without this row
// existing — a fresh database with content but no Event is a broken
// environment, not a partial one, which is why this runs unconditionally
// first in seed.ts's orchestration, independent of every other script.
// ============================================================================

import prisma from "@/lib/prisma";
import "dotenv/config"

/**
 * Idempotent via upsert on the enforced singleton (Event.singleton is
 * `Int @unique @default(1)`) — safe to run this script alone, repeatedly,
 * without ever producing a second row or erroring on a duplicate.
 *
 * Schedule values are illustrative defaults for local/CI seeding — a
 * real event's actual start/end time is an admin-configured value, set
 * via the Event update path, not hardcoded here permanently. This seed
 * exists so `getEventAccess()` has something valid to compute against
 * from a fresh database, not to be the source of truth for a live event.
 */
export async function seedEvent(): Promise<void> {
  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +1 day
  const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000); // +4 hours

  await prisma.event.upsert({
    where: { singleton: 1 },
    update: {}, // Never overwrite an already-configured event on re-run.
    create: {
      singleton: 1,
      title: "Operation Silk Road",
      startsAt,
      endsAt,
    },
  });

  console.log("[seed-event] Event singleton ready.");
}

if (require.main === module) {
  seedEvent()
    .catch((error) => {
      console.error("[seed-event] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
