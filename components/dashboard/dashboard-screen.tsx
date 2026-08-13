"use client";

import { DashboardContent } from "./dashboard-content";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardError } from "./states/dashboard-error";
import { useDashboard } from "@/modules/dashboard/hooks/use-dashboard";

export function DashboardScreen() {
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <DashboardError onRetry={() => refetch()} />;

  return <DashboardContent data={data} />;
}