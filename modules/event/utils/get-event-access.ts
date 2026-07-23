import type { Event } from "@/app/generated/prisma/client";
import type { EventAccess } from "../types/event.types";

export function getEventAccess(
  event: Event,
  now: Date = new Date(),
): EventAccess {
  const hasStarted = now >= event.startsAt;
  const hasEnded = now >= event.endsAt;

  if (!hasStarted) {
    return { state: "EVENT_SOON", canAccessGame: false, hasStarted, hasEnded };
  }
  if (hasEnded) {
    return { state: "EVENT_ENDED", canAccessGame: false, hasStarted, hasEnded };
  }
  return { state: "EVENT_LIVE", canAccessGame: true, hasStarted, hasEnded };
}