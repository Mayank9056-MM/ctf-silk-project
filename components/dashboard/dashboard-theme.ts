/**
 * Centralized semantic token registry. Every value here is a Tailwind
 * utility string pointing at a CSS custom property defined in
 * app/globals.css's "Dashboard Design Tokens" block — nothing in this
 * file (or any component that imports it) should ever write a raw hex
 * value or bg-[#...] inline.
 */
export const dashboardTheme = {
  background: {
    void: "bg-(--sr-bg-void)",
    base: "bg-(--sr-bg-base)",
    elevated: "bg-(--sr-bg-elevated)",
    surface: "bg-(--sr-bg-surface)",
    surfaceStrong: "bg-(--sr-bg-surface-strong)",
  },
  text: {
    primary: "text-(--sr-text-primary)",
    secondary: "text-(--sr-text-secondary)",
    muted: "text-(--sr-text-muted)",
    disabled: "text-(--sr-text-disabled)",
  },
  accent: {
    steel: "text-(--sr-steel)",
    blue: "text-(--sr-blue)",
    cyanMuted: "text-(--sr-cyan-muted)",
  },
  danger: {
    crimson: "text-(--sr-crimson)",
    crimsonMuted: "text-(--sr-crimson-muted)",
  },
  status: {
    live: "text-(--sr-status-live)",
    paused: "text-(--sr-status-paused)",
    warning: "text-(--sr-status-warning)",
    ended: "text-(--sr-status-ended)",
  },
  border: {
    subtle: "border-(--sr-border-subtle)",
    normal: "border-(--sr-border-normal)",
    strong: "border-(--sr-border-strong)",
  },
  font: {
    display: "sr-font-display",
    ui: "sr-font-ui",
    body: "sr-font-body",
    mono: "sr-font-mono",
  },
} as const;

export type EventVisualState = "SOON" | "LIVE" | "PAUSED" | "ENDED";

/** Single source of truth for state → accent color. Every component that colors by event state reads this instead of re-deriving it. */
export const EVENT_STATE_ACCENT: Record<EventVisualState, string> = {
  SOON: dashboardTheme.text.secondary,
  LIVE: dashboardTheme.status.live,
  PAUSED: dashboardTheme.status.paused,
  ENDED: dashboardTheme.status.ended,
};

export const EVENT_STATE_COPY: Record<
  EventVisualState,
  { headline: string; sub: string }
> = {
  SOON: { headline: "Investigation Window", sub: "Opens In" },
  LIVE: { headline: "Investigation Live", sub: "Time Remaining" },
  PAUSED: {
    headline: "Investigation Paused",
    sub: "Operations are temporarily suspended.",
  },
  ENDED: {
    headline: "Case Closed",
    sub: "The investigation window has closed.",
  },
};
