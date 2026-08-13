"use client";

import { DashboardContent } from "./dashboard-content";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardError } from "./states/dashboard-error";
import { useDashboard } from "@/modules/dashboard/hooks/use-dashboard";

interface DashboardScreenProps {
  username: string;
}

export function DashboardScreen({ username }: DashboardScreenProps) {
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <DashboardError onRetry={() => refetch()} />;

  return <DashboardContent username={username} data={data} />;
}