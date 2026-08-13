"use client";

import { cn } from "@/lib/utils";
import { useDashboardEntrance } from "./motion/dashboard-motion";
import { DashboardHeader } from "./header/dashboard-header";
import { DashboardStatusStrip } from "./status/dashboard-status-strip";
import { InvestigationHero } from "./hero/investigation-hero";
import { IntelligenceOverview } from "./intelligence/intelligence-overview";
import { EvidenceOverview } from "./evidence/evidence-overview";
import { NextObjective } from "./objective/next-objective";
import { LeaderboardPreview } from "./leaderboard/leaderboard-preview";
import { AnnouncementPanel } from "./announcements/announcement-panel";
import type { DashboardDTO } from "@/modules/dashboard/types/dashboard.dto";

interface DashboardContentProps {
  username: string;
  data: DashboardDTO;
}

/**
 * Split out of dashboard-screen.tsx specifically so the GSAP entrance
 * scope mounts exactly once, exactly when the real content exists —
 * not on DashboardShell (which stays mounted through the loading
 * skeleton, so useGSAP's single mount-time run found zero targets; see
 * the terminal log's "GSAP target not found" warnings). Because this
 * component only exists in the tree once `data` has resolved, its own
 * mount is the first moment any `.sr-dash-anim-*` class is present —
 * which is exactly when useGSAP needs to run.
 */
export function DashboardContent({ username, data }: DashboardContentProps) {
  const scopeRef = useDashboardEntrance();

  return (
    <div ref={scopeRef} className="space-y-4">
      <DashboardHeader username={username} event={data.event} unreadCount={data.notifications?.unreadCount ?? 0} />
      <DashboardStatusStrip event={data.event} />
      <InvestigationHero investigation={data.investigation} event={data.event} />
      <IntelligenceOverview data={data} />

      <div className="grid grid-cols-3 gap-4">
        <div className={cn("space-y-4")}>
          <EvidenceOverview evidence={data.evidence} />
          <NextObjective objective={data.nextObjective} />
        </div>
        <LeaderboardPreview preview={data.leaderboardPreview} currentUserRank={data.rank.rank} />
        <AnnouncementPanel announcements={data.announcements} />
      </div>
    </div>
  );
}