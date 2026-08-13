import type { Metadata } from "next";
import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { PLATFORM_NAME } from "@/lib/constants/brand";

export const metadata: Metadata = { title: `Mission Control — ${PLATFORM_NAME}` };

/**
 * requireAuth() is kept as a defense-in-depth gate even though this app
 * already has proxy.ts + presumably a protected-route layout guarding
 * this segment — matches the same "deliberate second layer, don't trust
 * the edge check alone" reasoning the auth layout's own comment states
 * for guest routes. Its return value is no longer used for anything
 * (see dashboard-header.tsx's doc comment on why `.name` was dead)
 * — PlayerMenu gets real identity from useSession() client-side instead.
 */
export default async function DashboardPage() {
  await requireAuth();

  return (
    <DashboardShell>
      <DashboardScreen />
    </DashboardShell>
  );
}