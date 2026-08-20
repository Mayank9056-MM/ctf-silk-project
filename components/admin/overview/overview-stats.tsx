"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { usePlayers } from "@/modules/admin/hooks/player-management/use-players";
import { useAnnouncements } from "@/modules/announcement/hooks/use-announcements";
import { UserStatus } from "@/app/generated/prisma/enums";
import { useAdminLeaderboard } from "@/modules/leaderboard/hooks/use-admin-leaderboard";

/**
 * Deliberately built from four EXISTING list queries (page size 1, read
 * only their `total`/`totalCount`) rather than a new aggregate stats
 * action — no get-admin-stats.ts exists anywhere in this codebase, and
 * inventing one plus its own service method for four numbers the
 * individual panels already compute would be a speculative backend
 * addition, not something this task asked for. If this page is slow at
 * real scale, that's the signal to build a real aggregate endpoint —
 * not a guess to make now.
 */
export function OverviewStats() {
  const players = usePlayers({ page: 1, pageSize: 1 });
  const bannedPlayers = usePlayers({ page: 1, pageSize: 1, status: UserStatus.BANNED });
  const leaderboard = useAdminLeaderboard(1, 1);
  const announcements = useAnnouncements(1, 1);

  const loading =
    players.isLoading ||
    bannedPlayers.isLoading ||
    leaderboard.isLoading ||
    announcements.isLoading;

  if (loading) {
    return (
      <div className="ops-stat-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[70px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="ops-stat-grid">
      <div className="ops-stat-card">
        <div className="ops-stat-label">Total Players</div>
        <div className="ops-stat-value">{players.data?.total ?? "—"}</div>
      </div>
      <div className="ops-stat-card">
        <div className="ops-stat-label">Banned Players</div>
        <div className="ops-stat-value">{bannedPlayers.data?.total ?? "—"}</div>
      </div>
      <div className="ops-stat-card">
        <div className="ops-stat-label">Ranked Players</div>
        <div className="ops-stat-value">{leaderboard.data?.totalCount ?? "—"}</div>
      </div>
      <div className="ops-stat-card">
        <div className="ops-stat-label">Active Announcements</div>
        <div className="ops-stat-value">{announcements.data?.total ?? "—"}</div>
      </div>
    </div>
  );
}
