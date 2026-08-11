// modules/dashboard/hooks/use-dashboard.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../actions/get-dashboard";
import { dashboardKeys } from "../constants/dashboard.keys";

/**
 * 30s staleTime, no explicit refetchOnWindowFocus override — matches
 * useAnnouncement/useAnnouncements exactly (the two hooks actually shown
 * in this session), rather than inventing a different cache posture.
 * No polling interval, per the explicit "do not implement aggressive
 * polling" instruction — the countdown renders from the server-provided
 * timestamps client-side, not from a per-second refetch.
 */
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: () => getDashboard(),
    staleTime: 30_000,
  });
}