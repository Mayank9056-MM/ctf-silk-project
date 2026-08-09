// modules/event/types/event.types.ts

/**
 * Event lifecycle derived from timestamps.
 * This is NOT stored in the database.
 */
export type EventState = "EVENT_SOON" | "EVENT_LIVE" | "EVENT_ENDED";

/**
 * Result returned by getEventAccess() — the single, authoritative
 * access decision for the platform, combining the Event's scheduled
 * lifecycle with EventControl's operational pause/registration
 * override. Every gated consumer (Auth, Submission, Story, Unlock)
 * reads this shape rather than reconstructing policy from raw
 * Event/EventControl fields itself.
 *
 * isPaused is exposed alongside canAccessGame (rather than folded away)
 * specifically so a consumer building a rejection message can
 * distinguish "not started" / "paused" / "ended" — three genuinely
 * different reasons that all produce canAccessGame = false. See
 * story.service.ts's restartStory() for the concrete case this exists
 * to support.
 *
 * pausedAt/pauseReason/pausedById are deliberately NOT here — those are
 * internal admin detail (see EventControlDTO's own comment), exposed
 * only through the admin-gated EventControlService.getEventControl()
 * path, never through this player-facing access result.
 */
export interface EventAccess {
  state: EventState;
  canAccessGame: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
  /** True only when the schedule is LIVE and EventControl.mode is PAUSED. Never true for SOON/ENDED — pause has no meaning outside a live window. */
  isPaused: boolean;
  /** The raw EventControl.registrationEnabled toggle, echoed for consumers that need the unfiltered admin setting rather than the derived canRegister. */
  registrationEnabled: boolean;
  /** registrationEnabled combined with schedule policy — see get-event-access.ts for the exact rule. */
  canRegister: boolean;
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
