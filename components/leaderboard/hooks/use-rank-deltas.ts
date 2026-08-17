"use client";

import { useEffect, useRef, useState } from "react";
import type { LeaderboardRowDTO } from "@/modules/leaderboard/types/leaderboard.dto";

export type RankDelta = "up" | "down" | "same";

/**
 * Diffs each poll's ranks against the previous poll's, purely for a
 * cosmetic movement indicator (▲/▼) — never a source of truth for
 * anything, never persisted. Keyed by userId so it survives re-sorting.
 * Returns an empty map until a SECOND poll has landed for the same
 * page, since there's nothing to compare the first render against.
 */
export function useRankDeltas(
  rows: LeaderboardRowDTO[] | undefined,
  enabled: boolean,
): Map<string, RankDelta> {
  const previousRef = useRef<Map<string, number> | null>(null);
  const [deltas, setDeltas] = useState<Map<string, RankDelta>>(new Map());

  useEffect(() => {
    if (!enabled || !rows) return;

    const current = new Map(rows.map((r) => [r.userId, r.rank]));

    if (previousRef.current) {
      const next = new Map<string, RankDelta>();
      for (const [userId, rank] of current) {
        const prevRank = previousRef.current.get(userId);
        if (prevRank === undefined) continue;
        if (rank < prevRank) next.set(userId, "up");
        else if (rank > prevRank) next.set(userId, "down");
        else next.set(userId, "same");
      }
      setDeltas(next);
    }

    previousRef.current = current;
  }, [rows, enabled]);

  return deltas;
}