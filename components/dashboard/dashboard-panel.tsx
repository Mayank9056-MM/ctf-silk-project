import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "./dashboard-theme";

interface DashboardPanelProps {
  children: ReactNode;
  className?: string;
  as?: "section" | "article" | "div";
}

/**
 * Added: corner ticks (sr-dash-panel, see globals.css), and a subtle
 * hover lift/border-brighten — CSS-only (transition + transform), no
 * JS, so this stays cheap across every panel on the page even under
 * the 2,000-concurrent-player performance constraint.
 */
export function DashboardPanel({ children, className, as: Tag = "section" }: DashboardPanelProps) {
  return (
    <Tag
      className={cn(
        "sr-dash-panel relative rounded-lg border p-4 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-(--sr-border-strong)",
        dashboardTheme.background.surface,
        dashboardTheme.border.normal,
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function DashboardPanelTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "mb-3 flex items-center justify-between gap-2 border-b pb-2.5 text-[11px] font-medium tracking-[0.14em] uppercase",
        dashboardTheme.text.secondary,
        dashboardTheme.border.subtle,
        dashboardTheme.font.ui,
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-[3px] shrink-0 rounded-full bg-(--sr-crimson-hot)" aria-hidden="true" />
        {children}
      </span>
      {action}
    </h3>
  );
}