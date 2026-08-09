import type { EventOperationalMode } from "@/app/generated/prisma/enums";

/**
 * Application-facing representation of EventControl — the operational
 * pause/registration state of the (single) live event. Deliberately
 * omits eventId: EventControl always points at the one Event singleton
 * this platform runs, the same reasoning already established elsewhere
 * for why Event never gained dependent foreign keys — a constant isn't
 * state.
 *
 * No relation data (pausedBy, event) — the repository this DTO is built
 * from doesn't load either relation, and this file must not assume data
 * that isn't there. pausedById stays as a raw id, not a nested object.
 *
 * No derived fields (isPaused, canRegister, eventStatus, etc.) — this
 * represents persisted state exactly as stored, never a computed
 * lifecycle judgment. No actor/audit/permission data — those are
 * separate concerns owned by admin-access.ts, event-control-access.ts,
 * and the audit module respectively, not this state contract.
 */
export interface EventControlDTO {
  readonly id: string;

  readonly mode: EventOperationalMode;

  readonly registrationEnabled: boolean;

  /** Null when mode is NORMAL. */
  readonly pausedAt: Date | null;

  /** Null when mode is NORMAL, or when a pause was recorded without one. */
  readonly pauseReason: string | null;

  /** The admin who most recently paused the event. Null when mode is NORMAL. */
  readonly pausedById: string | null;

  readonly updatedAt: Date;
}
