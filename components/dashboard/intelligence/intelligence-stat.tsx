import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";

interface IntelligenceStatProps {
  label: string;
  value: string;
  context?: string;
  indicator?: ReactNode;
  /** Category identity dot — e.g. "bg-(--sr-crimson-hot)". Purely a left-hand visual grouping cue, not a status. */
  accentClassName?: string;
}

export function IntelligenceStat({ label, value, context, indicator, accentClassName }: IntelligenceStatProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          {accentClassName && <span className={cn("size-1.5 rounded-full", accentClassName)} aria-hidden="true" />}
          <span className={cn("text-[9px] tracking-[0.14em] uppercase", dashboardTheme.text.muted, dashboardTheme.font.mono)}>{label}</span>
        </span>
        {indicator}
      </div>
      <span className={cn("text-xl font-semibold tabular-nums", dashboardTheme.text.primary, dashboardTheme.font.display)}>{value}</span>
      {context && <span className={cn("text-[10.5px]", dashboardTheme.text.muted, dashboardTheme.font.body)}>{context}</span>}
    </div>
  );
}