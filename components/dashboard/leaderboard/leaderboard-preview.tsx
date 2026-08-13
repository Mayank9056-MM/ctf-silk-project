import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { srButtonGhost } from "../dashboard-button";
import { DashboardPanel, DashboardPanelTitle } from "../dashboard-panel";
import { LeaderboardScope } from "./leaderboard-scope";
import { LeaderboardRow } from "./leaderboard-row";
import { DashboardStagger } from "../motion/dashboard-stagger";
import type { DashboardLeaderboardPreviewDTO } from "@/modules/dashboard/types/dashboard.dto";

interface LeaderboardPreviewProps {
  preview: DashboardLeaderboardPreviewDTO;
  currentUserRank: number | null;
}

export function LeaderboardPreview({ preview, currentUserRank }: LeaderboardPreviewProps) {
  return (
    <DashboardPanel className="sr-dash-anim-secondary">
     <DashboardPanelTitle action={<LeaderboardScope scope={preview.scope} />}>
  Live Standings
</DashboardPanelTitle>

      {preview.rows.length > 0 ? (
        <DashboardStagger className="flex flex-col gap-0.5">
          {preview.rows.map((row) => (
            <LeaderboardRow key={row.userId} row={row} isCurrentUser={row.rank === currentUserRank} />
          ))}
        </DashboardStagger>
      ) : (
        <p className={cn("text-[12px]", dashboardTheme.text.muted, dashboardTheme.font.body)}>No standings available yet.</p>
      )}

      <Link href="/leaderboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), srButtonGhost, "mt-3 w-full")}>
        View Full Leaderboard
      </Link>
    </DashboardPanel>
  );
}