// modules/event/types/event.types.ts

/**
 * Event lifecycle derived from timestamps.
 * This is NOT stored in the database.
 */
export type EventState = "EVENT_SOON" | "EVENT_LIVE" | "EVENT_ENDED";

/**
 * Result returned by getEventAccess().
 */
export interface EventAccess {
  state: EventState;
  canAccessGame: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
}

/**
 * Countdown information for the dashboard.
 */
export interface EventCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMiliseconds: number;
}
