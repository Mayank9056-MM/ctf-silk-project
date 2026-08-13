import { IntelligenceStat } from "./intelligence-stat";
import type { DashboardInvestigationDTO } from "@/modules/dashboard/types/dashboard.dto";

export function InvestigationStat({ investigation }: { investigation: DashboardInvestigationDTO }) {
  return (
   <IntelligenceStat
  label="Investigation"
  value={`${investigation.completedChapters}/${investigation.totalChapters}`}
  context="Chapters complete"
  accentClassName="bg-(--sr-crimson-hot)"
/>
  );
}