"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "@/components/dashboard/dashboard-theme";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LeaderboardRowDTO } from "@/modules/leaderboard/types/leaderboard.dto";
import type { RankDelta } from "../hooks/use-rank-deltas";

interface LeaderboardTableProps {
  rows: LeaderboardRowDTO[];
  currentUserRank: number | null;
  deltas: Map<string, RankDelta>;
  isFrozen: boolean;
}

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

function DeltaIcon({ delta }: { delta: RankDelta | undefined }) {
  if (delta === "up") return <TrendingUp className="size-3.5 text-(--sr-teal-hot)" aria-label="Moved up" />;
  if (delta === "down") return <TrendingDown className="size-3.5 text-(--sr-crimson-hot)" aria-label="Moved down" />;
  if (delta === "same") return <Minus className="size-3.5 text-(--sr-text-disabled)" aria-label="No change" />;
  return <span className="inline-block size-3.5" aria-hidden="true" />;
}

export function LeaderboardTable({ rows, currentUserRank, deltas, isFrozen }: LeaderboardTableProps) {
  if (rows.length === 0) return null;

  return (
    <div className={cn("overflow-hidden rounded-lg border", dashboardTheme.border.normal, dashboardTheme.background.surface)}>
      <Table>
        <TableHeader>
          <TableRow className={cn("hover:bg-transparent", dashboardTheme.border.subtle)}>
            <TableHead className={cn("w-14 text-[10px] tracking-[0.12em] uppercase", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
              Rank
            </TableHead>
            <TableHead className={cn("text-[10px] tracking-[0.12em] uppercase", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
              Investigator
            </TableHead>
            <TableHead className={cn("text-right text-[10px] tracking-[0.12em] uppercase", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
              Solves
            </TableHead>
            <TableHead className={cn("text-right text-[10px] tracking-[0.12em] uppercase", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
              XP
            </TableHead>
            {!isFrozen && (
              <TableHead className={cn("w-10 text-right text-[10px] tracking-[0.12em] uppercase", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
                Δ
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence initial={false} mode="popLayout">
            {rows.map((row) => {
              const isCurrentUser = row.rank === currentUserRank;
              return (
                <motion.tr
                  key={row.userId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={cn(
                    "border-b transition-colors last:border-0",
                    dashboardTheme.border.subtle,
                    isCurrentUser ? "sr-lb-row-highlight bg-(--sr-crimson-muted)/10" : "hover:bg-(--sr-bg-surface-strong)",
                  )}
                >
                  <TableCell className={cn("text-[12px] font-semibold tabular-nums", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
                    {String(row.rank).padStart(2, "0")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback className={cn(dashboardTheme.background.surfaceStrong, dashboardTheme.text.secondary, dashboardTheme.font.ui, "text-[10px]")}>
                          {initials(row.fullName || row.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={cn("text-[12.5px]", isCurrentUser ? dashboardTheme.danger.crimson : dashboardTheme.text.primary, dashboardTheme.font.ui)}>
                        {row.username}
                        {isCurrentUser && (
                          <span className={cn("ml-2 text-[9px] tracking-[0.1em] uppercase", dashboardTheme.text.muted)}>You</span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={cn("text-right text-[12px] tabular-nums", dashboardTheme.text.secondary, dashboardTheme.font.mono)}>
                    {row.solvedChallenges}
                  </TableCell>
                  <TableCell className={cn("text-right text-[13px] font-semibold tabular-nums", dashboardTheme.text.primary, dashboardTheme.font.mono)}>
                    {row.totalXp.toLocaleString()}
                  </TableCell>
                  {!isFrozen && (
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <DeltaIcon delta={deltas.get(row.userId)} />
                      </div>
                    </TableCell>
                  )}
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}