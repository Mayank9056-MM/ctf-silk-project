"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "@/components/dashboard/dashboard-theme";
import { DashboardError } from "@/components/dashboard/states/dashboard-error";
import { useLeaderboard } from "@/modules/leaderboard/hooks/use-leaderboard";
import { useMyRank } from "@/modules/leaderboard/hooks/use-my-rank";
import { LEADERBOARD_CONSTANTS } from "@/modules/leaderboard/constants/leaderboard.constants";
import { LeaderboardHero } from "./hero/leaderboard-hero";
import { LeaderboardPodium } from "./podium/leaderboard-podium";
import { LeaderboardTable } from "./table/leaderboard-table";
import { LeaderboardPager } from "./pagination/leaderboard-pager";
import { LeaderboardSkeleton } from "./states/leaderboard-skeleton";
import { useLeaderboardEntrance } from "./motion/use-leaderboard-entrance";
import { useRankDeltas } from "./hooks/use-rank-deltas";

const PAGE_SIZE = LEADERBOARD_CONSTANTS.DEFAULT_PAGE_SIZE;

export function LeaderboardScreen() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isFetching } = useLeaderboard(page, PAGE_SIZE);
  const { data: myRank } = useMyRank();
  const scopeRef = useLeaderboardEntrance();

  const isFrozen = data?.isFrozen ?? false;
  const deltas = useRankDeltas(data?.rows, !isLoading && !isFrozen);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
  const isFirstPage = page === 1;
  const podiumRows = isFirstPage ? (data?.rows.slice(0, 3) ?? []) : [];
  const tableRows = isFirstPage ? (data?.rows.slice(3) ?? []) : (data?.rows ?? []);
  const currentUserRank = myRank?.rank ?? null;

  return (
    <div ref={scopeRef} className="relative min-h-dvh bg-(--sr-bg-void)">
      <div className="sr-lb-anim-bg pointer-events-none absolute inset-0">
        <div className="sr-dash-vignette" />
        <div className="sr-dash-grain" />
        <div className="sr-lb-backdrop" />
        <div className="sr-lb-beam" />
      </div>

      <div className="relative z-[1] mx-auto min-w-[1280px] max-w-[1440px] px-6 pb-16 pt-6">
        <div className="sr-lb-anim-hero">
          <LeaderboardHero isFrozen={isFrozen} myRank={myRank ?? null} isFetching={isFetching} />
        </div>

        {isLoading ? (
          <LeaderboardSkeleton />
        ) : isError || !data ? (
          <div className="mt-6">
            <DashboardError onRetry={() => refetch()} />
          </div>
        ) : data.rows.length === 0 ? (
          <div className={cn("mt-10 rounded-lg border border-dashed p-14 text-center", dashboardTheme.border.normal)}>
            <p className={cn("text-[13px]", dashboardTheme.text.muted, dashboardTheme.font.body)}>
              No standings recorded yet. Solve a challenge to appear on the board.
            </p>
          </div>
        ) : (
          <>
            {podiumRows.length > 0 && (
              <div className="sr-lb-anim-podium mt-8">
                <LeaderboardPodium rows={podiumRows} currentUserRank={currentUserRank} deltas={deltas} />
              </div>
            )}

            <div className="sr-lb-anim-table mt-8">
              <LeaderboardTable rows={tableRows} currentUserRank={currentUserRank} deltas={deltas} isFrozen={isFrozen} />
            </div>

            <div className="mt-8">
              <LeaderboardPager page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}