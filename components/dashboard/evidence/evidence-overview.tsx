import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { DashboardPanel, DashboardPanelTitle } from "../dashboard-panel";
import { EvidenceStatus } from "./evidence-status";
import { EvidenceProgress } from "./evidence-progress";
import type { DashboardEvidenceDTO } from "@/modules/dashboard/types/dashboard.dto";

export function EvidenceOverview({ evidence }: { evidence: DashboardEvidenceDTO | null }) {
  return (
    <DashboardPanel className="sr-dash-anim-secondary">
      <DashboardPanelTitle>Current Case Evidence</DashboardPanelTitle>
      {evidence ? (
        <>
          <EvidenceStatus recovered={evidence.recovered} total={evidence.total} />
          <EvidenceProgress progressPercent={evidence.progressPercent} />
        </>
      ) : (
        <p className={cn("text-[12px]", dashboardTheme.text.muted, dashboardTheme.font.body)}>
          Evidence system not yet initialized. Begin the investigation to access recovered evidence.
        </p>
      )}
    </DashboardPanel>
  );
}