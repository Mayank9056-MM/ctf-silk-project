import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { LeaderboardRank } from "./leaderboard-rank";
import { DashboardStaggerItem } from "../motion/dashboard-stagger";
import type { LeaderboardRowDTO } from "@/modules/leaderboard/types/leaderboard.dto";

interface LeaderboardRowProps {
  row: LeaderboardRowDTO;
  isCurrentUser: boolean;
}

export function LeaderboardRow({ row, isCurrentUser }: LeaderboardRowProps) {
  return (
   <DashboardStaggerItem
  className={cn(
    "flex items-center justify-between rounded-md px-2 py-1.5 transition-colors",
    isCurrentUser
      ? "border border-(--sr-crimson-muted)/40 bg-(--sr-crimson-muted)/10"
      : "hover:bg-(--sr-bg-surface-strong)",
  )}
>
      <span className="flex items-center gap-2">
        <LeaderboardRank rank={row.rank} />
        <span className={cn("text-[12px]", isCurrentUser ? dashboardTheme.danger.crimson : dashboardTheme.text.primary, dashboardTheme.font.ui)}>
          {row.username}
        </span>
      </span>
      <span className={cn("text-[11px] tabular-nums", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
        {row.totalXp.toLocaleString()}
      </span>
    </DashboardStaggerItem>
  );
}