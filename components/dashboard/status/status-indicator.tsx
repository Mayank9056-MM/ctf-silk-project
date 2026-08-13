import { cn } from "@/lib/utils";
import { dashboardTheme, type EventVisualState, EVENT_STATE_ACCENT } from "../dashboard-theme";

interface StatusIndicatorProps {
  state: EventVisualState;
  label: string;
  className?: string;
}

/**
 * Shared by status/dashboard-status-strip.tsx and states/dashboard-*.tsx —
 * your file list showed status-indicator.tsx under both folders; rather
 * than duplicate it, it lives here and states/ imports it. Status is
 * never color-only: the text label is always present alongside the dot.
 */
export function StatusIndicator({ state, label, className }: StatusIndicatorProps) {
  const isLive = state === "LIVE";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          isLive ? "bg-(--sr-status-live)" : "bg-current",
          EVENT_STATE_ACCENT[state],
          isLive && "animate-pulse",
        )}
        aria-hidden="true"
      />
      <span className={cn("text-[11px] font-semibold tracking-[0.12em] uppercase", EVENT_STATE_ACCENT[state], dashboardTheme.font.ui)}>
        {label}
      </span>
    </span>
  );
}