"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dashboardTheme, EVENT_STATE_COPY } from "../dashboard-theme";
import { StatusIndicator } from "./status-indicator";
import { srButtonOutline } from "../dashboard-button";
import { useCountdown, formatCountdown } from "./use-countdown";
import type { DashboardEventDTO } from "@/modules/dashboard/types/dashboard.dto";

interface DashboardStatusStripProps {
  event: DashboardEventDTO;
}

/**
 * The dedicated EVENT/CASE STATUS section (spec section 8), distinct
 * from the compact header badge. Handles all four states per spec
 * section 10 — PAUSED/ENDED never render an action implying continuation.
 *
 * Sub-label ("Time Remaining" / "Opens In" / etc.) moved from
 * text.muted to text.secondary — same low-contrast issue as the brand
 * subtitle, same fix.
 */
export function DashboardStatusStrip({ event }: DashboardStatusStripProps) {
  const target =
    event.state === "SOON" ? new Date(event.startsAt) : event.state === "LIVE" ? new Date(event.endsAt) : null;
  const countdown = useCountdown(target);
  const copy = EVENT_STATE_COPY[event.state];
  const showClock = event.state === "SOON" || event.state === "LIVE";

  return (
    <section
      className={cn(
        "sr-dash-anim-status flex items-center justify-between rounded-lg border px-5 py-4",
        dashboardTheme.background.elevated,
        dashboardTheme.border.normal,
      )}
      aria-live="polite"
    >
      <div className="flex flex-col gap-1.5">
        <StatusIndicator state={event.state} label={copy.headline} />
        <span className={cn("sr-text-crisp text-[11px]", dashboardTheme.text.secondary, dashboardTheme.font.mono)}>
          {showClock ? copy.sub : copy.sub}
        </span>
      </div>

      {showClock && (
        <span
          className={cn("text-2xl font-semibold tabular-nums tracking-tight", dashboardTheme.text.primary, dashboardTheme.font.mono)}
          role="timer"
        >
          {formatCountdown(countdown)}
        </span>
      )}

      {event.state === "ENDED" && (
        <Link href="/leaderboard" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), srButtonOutline)}>
          View Final Standings
        </Link>
      )}
    </section>
  );
}