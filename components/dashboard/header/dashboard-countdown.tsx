"use client";

import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { useCountdown, formatCountdown } from "../status/use-countdown";
import type { DashboardEventDTO } from "@/modules/dashboard/types/dashboard.dto";

/** Compact inline countdown for the header — same hook the status strip uses, just smaller and always-visible regardless of state. */
export function DashboardCountdown({ event }: { event: DashboardEventDTO }) {
  const target =
    event.state === "SOON" ? new Date(event.startsAt) : event.state === "LIVE" ? new Date(event.endsAt) : null;
  const countdown = useCountdown(target);

  if (!target) return null;

  return (
    <span className={cn("text-[11px] tabular-nums", dashboardTheme.text.secondary, dashboardTheme.font.mono)}>
      {formatCountdown(countdown)}
    </span>
  );
}