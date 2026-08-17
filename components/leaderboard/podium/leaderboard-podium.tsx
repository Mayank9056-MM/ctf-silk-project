"use client";

import { cn } from "@/lib/utils";
import { dashboardTheme } from "@/components/dashboard/dashboard-theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, TrendingUp, TrendingDown } from "lucide-react";
import type { LeaderboardRowDTO } from "@/modules/leaderboard/types/leaderboard.dto";
import type { RankDelta } from "../hooks/use-rank-deltas";

interface LeaderboardPodiumProps {
  rows: LeaderboardRowDTO[];
  currentUserRank: number | null;
  deltas: Map<string, RankDelta>;
}

const PODIUM_STYLE: Record<number, { glow: string; ring: string; pad: string; order: string }> = {
  1: { glow: "sr-lb-podium-glow-gold", ring: "ring-(--sr-gold)/40", pad: "pt-0", order: "order-2" },
  2: { glow: "sr-lb-podium-glow-steel", ring: "ring-(--sr-steel)/40", pad: "pt-6", order: "order-1" },
  3: { glow: "sr-lb-podium-glow-crimson", ring: "ring-(--sr-crimson-hot)/35", pad: "pt-6", order: "order-3" },
};

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function LeaderboardPodium({ rows, currentUserRank, deltas }: LeaderboardPodiumProps) {
  if (rows.length === 0) return null;

  return (
    <div className="grid grid-cols-3 items-end gap-4">
      {rows.map((row) => {
        const style = PODIUM_STYLE[row.rank] ?? PODIUM_STYLE[3];
        const isCurrentUser = row.rank === currentUserRank;
        const delta = deltas.get(row.userId);

        return (
          <div key={row.userId} className={cn("flex flex-col items-center", style.order, style.pad)}>
            <div
              className={cn(
                "relative flex w-full flex-col items-center gap-3 rounded-lg border p-5 text-center ring-1",
                style.glow,
                style.ring,
                dashboardTheme.background.surface,
                isCurrentUser ? "border-(--sr-crimson-hot)/50" : dashboardTheme.border.normal,
              )}
            >
              {row.rank === 1 && (
                <Crown
                  className="absolute -top-8 size-6 text-(--sr-gold) drop-shadow-[0_0_10px_rgba(217,164,65,0.6)]"
                  aria-hidden="true"
                />
              )}

              <span
                className={cn(
                  "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tabular-nums",
                  dashboardTheme.background.surfaceStrong,
                  dashboardTheme.border.strong,
                  dashboardTheme.text.primary,
                  dashboardTheme.font.mono,
                )}
              >
                #{row.rank}
              </span>

              <Avatar size="lg" className="mt-2 ring-2 ring-(--sr-border-strong)">
                <AvatarFallback className={cn(dashboardTheme.background.surfaceStrong, dashboardTheme.text.primary, dashboardTheme.font.ui)}>
                  {initials(row.fullName || row.username)}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className={cn("truncate text-[13px] font-semibold", dashboardTheme.text.primary, dashboardTheme.font.ui)}>
                  {row.username}
                </p>
                <p className={cn("mt-0.5 text-[10px]", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
                  {row.solvedChallenges} solve{row.solvedChallenges === 1 ? "" : "s"}
                </p>
              </div>

              <p className={cn("text-[20px] font-bold tabular-nums", dashboardTheme.text.primary, dashboardTheme.font.display)}>
                {row.totalXp.toLocaleString()}
                <span className={cn("ml-1 text-[10px] font-normal", dashboardTheme.text.muted)}>XP</span>
              </p>

              {delta === "up" && <TrendingUp className="size-3.5 text-(--sr-teal-hot)" aria-label="Moved up" />}
              {delta === "down" && <TrendingDown className="size-3.5 text-(--sr-crimson-hot)" aria-label="Moved down" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}