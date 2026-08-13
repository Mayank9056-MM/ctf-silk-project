import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";

export function InvestigationKicker({ children }: { children: string }) {
  return (
    <span className={cn("text-[11px] font-semibold tracking-[0.24em] uppercase", dashboardTheme.danger.crimson, dashboardTheme.font.mono)}>
      {children}
    </span>
  );
}