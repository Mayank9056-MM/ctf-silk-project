"use client";

import { cn } from "@/lib/utils";
import { dashboardTheme } from "@/components/dashboard/dashboard-theme";
import { srBadgeBase, srBadgeGold, srBadgeTeal } from "@/components/dashboard/dashboard-badge";
import { Trophy, Lock, Radio } from "lucide-react";
import type { UserRankDTO } from "@/modules/leaderboard/types/leaderboard.dto";

interface LeaderboardHeroProps {
  isFrozen: boolean;
  myRank: UserRankDTO | null;
  isFetching: boolean;
}

export function LeaderboardHero({ isFrozen, myRank, isFetching }: LeaderboardHeroProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-7",
        dashboardTheme.border.normal,
        dashboardTheme.background.surface,
      )}
    >
      <div className="relative z-[1] flex flex-wrap items-end justify-between gap-6">
        <div>
          <span
            className={cn(
              "flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase",
              dashboardTheme.text.muted,
              dashboardTheme.font.mono,
            )}
          >
            <span className="h-2.5 w-[3px] rounded-full bg-(--sr-crimson-hot)" aria-hidden="true" />
            Operation Silk Road
          </span>
          <h1
            className={cn("mt-2 text-[34px] font-extrabold uppercase leading-none tracking-[0.01em]", dashboardTheme.font.display)}
            style={{
              backgroundImage: "linear-gradient(180deg, #fff 0%, #d8dade 55%, #8b9096 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {isFrozen ? "Standings — Frozen" : "Live Standings"}
          </h1>
          <p className={cn("mt-2 max-w-[52ch] text-[12.5px]", dashboardTheme.text.secondary, dashboardTheme.font.body)}>
            {isFrozen
              ? "Final rankings are locked. Results will be announced when the investigation concludes."
              : "Every solved challenge moves the board. Standings update automatically."}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className={cn(srBadgeBase, isFrozen ? srBadgeGold : srBadgeTeal)}>
            {isFrozen ? (
              <Lock className="size-2.5" aria-hidden="true" />
            ) : (
              <Radio className="sr-lb-rank-pulse size-2.5" aria-hidden="true" />
            )}
            {isFrozen ? "Frozen" : "Live"}
          </span>

          {isFetching && !isFrozen && (
            <span className={cn("text-[9.5px] tracking-[0.14em] uppercase", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
              Syncing…
            </span>
          )}

          <div
            className={cn(
              "flex items-center gap-3 rounded-md border px-4 py-2.5",
              dashboardTheme.border.normal,
              dashboardTheme.background.surfaceStrong,
            )}
          >
            <Trophy className={cn("size-4", dashboardTheme.status.warning)} aria-hidden="true" />
            <div>
              <p className={cn("text-[9px] tracking-[0.14em] uppercase", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
                Your Rank
              </p>
              <p className={cn("text-[15px] font-semibold tabular-nums", dashboardTheme.text.primary, dashboardTheme.font.ui)}>
                {myRank?.rank ? `#${myRank.rank}` : "Unranked"}
                {myRank && (
                  <span className={cn("ml-2 text-[11px] font-normal tabular-nums", dashboardTheme.text.muted)}>
                    {myRank.totalXp.toLocaleString()} XP
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}