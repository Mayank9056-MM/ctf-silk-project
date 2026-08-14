// ============================================================================
// seed-event.ts
// ============================================================================
//
// Seeds the Event singleton row AND its required EventControl companion
// row. EventControl is now load-bearing for every gated request —
// eventService.getEventAccess() throws NOT_FOUND if it's missing, the
// same severity already applied to a missing Event singleton itself.
// This addition is the minimal seed/default the EventControl
// integration genuinely requires (see the accompanying architecture
// notes) — not a speculative addition.
// ============================================================================

import prisma from "@/lib/prisma";
import { EventOperationalMode } from "@/app/generated/prisma/enums";
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
 *
 * The EventControl upsert mirrors the Event upsert's own discipline:
 * `update: {}` never overwrites an already-configured control row —
 * re-running this script must never silently un-pause a live event or
 * flip an admin's registration toggle back to a default. registrationEnabled
 * is set explicitly to `true` rather than relied upon as a schema
 * default, since this script has no independent way to confirm what
 * that default actually is.
 */
export async function seedEvent(): Promise<void> {
  const startsAt = new Date(Date.now()); // +1 day
  const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000); // +4 hours

  const event = await prisma.event.upsert({
    where: { singleton: 1 },
    update: {}, // Never overwrite an already-configured event on re-run.
    create: {
      singleton: 1,
      title: "Operation Silk Road",
      startsAt,
      endsAt,
    },
  });

  await prisma.eventControl.upsert({
    where: { eventId: event.id },
    update: {}, // Never overwrite an already-configured control row on re-run.
    create: {
      eventId: event.id,
      mode: EventOperationalMode.NORMAL,
      registrationEnabled: true,
    },
  });

  console.log("[seed-event] Event singleton and EventControl ready.");
}

if (require.main === module) {
  seedEvent()
    .catch((error) => {
      console.error("[seed-event] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}