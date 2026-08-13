import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";

export function LeaderboardRank({ rank }: { rank: number }) {
  return (
    <span className={cn("w-6 text-[11px] tabular-nums", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
      {String(rank).padStart(2, "0")}
    </span>
  );
}