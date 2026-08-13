import type { Metadata } from "next";
import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { PLATFORM_NAME } from "@/lib/constants/brand";

export const metadata: Metadata = { title: `Mission Control — ${PLATFORM_NAME}` };

/** Thin per spec sections 8/26 — no data fetching here. Identity comes straight from requireAuth() (already includes `name`), the actual dashboard aggregation flows entirely through useDashboard() → getDashboard() → dashboardService, untouched by this file. */
export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <DashboardShell>
      <DashboardScreen username={user.name} />
    </DashboardShell>
  );
}