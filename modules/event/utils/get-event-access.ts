import {
  EventOperationalMode,
  type Event,
  type EventControl,
} from "@/app/generated/prisma/client";
import type { EventAccess } from "../types/event.types";

export function getEventAccess(
  event: Event,
  control: Pick<EventControl, "mode" | "registrationEnabled">,
  now: Date = new Date(),
): EventAccess {
  const hasStarted = now >= event.startsAt;
  const hasEnded = now >= event.endsAt;
  const isPaused = control.mode === EventOperationalMode.PAUSED;

  const state: EventAccess["state"] = !hasStarted
    ? "EVENT_SOON"
    : hasEnded
      ? "EVENT_ENDED"
      : "EVENT_LIVE";

  // Schedule is authoritative for SOON/ENDED regardless of mode —
  // PAUSED only ever suppresses access from within an otherwise-LIVE
  // window. This is what guarantees RESUME can never reopen an ended
  // event or an event that hasn't started yet: outside EVENT_LIVE,
  // isPaused is never even consulted.
  const canAccessGame = state === "EVENT_LIVE" && !isPaused;

  // Registration policy — a judgment call, documented explicitly rather
  // than silently encoded: closed once the event has ended (no purpose
  // registering for something already over), otherwise gated purely by
  // the operational toggle. Deliberately NOT gated by isPaused —
  // pausing gameplay must never accidentally block new registrations,
  // and disabling registration must never affect gameplay (see
  // canAccessGame above, which never reads registrationEnabled).
  const canRegister = control.registrationEnabled && !hasEnded;

  return {
    state,
    canAccessGame,
    hasStarted,
    hasEnded,
    isPaused,
    registrationEnabled: control.registrationEnabled,
    canRegister,
  };
}
