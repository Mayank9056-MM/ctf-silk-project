// modules/event/utils/get-event-access.ts

import { Event, EventStatus } from "@/app/generated/prisma/client";

export function getEventAccess(event: Event, now = new Date()) {
  const hasStarted = now >= event.startsAt;
  const hasEnded = now > event.endsAt;

  const isPaused = event.status === EventStatus.EVENT_PAUSED;

  const canAccessGame =
    event.isPublished &&
    event.status === EventStatus.EVENT_LIVE &&
    hasStarted &&
    !hasEnded &&
    !isPaused;

  return {
    canAccessGame,
    hasStarted,
    hasEnded,
    isPaused,
  };
}
