import { IntelligenceStat } from "./intelligence-stat";
import type { DashboardEvidenceDTO } from "@/modules/dashboard/types/dashboard.dto";

export function EvidenceStat({ evidence }: { evidence: DashboardEvidenceDTO | null }) {
  return (
    <IntelligenceStat
  label="Evidence"
  value={evidence ? `${evidence.recovered}/${evidence.total}` : "—"}
  context={evidence ? `${evidence.progressPercent}% recovered` : "Not yet initialized"}
  accentClassName="bg-(--sr-teal-hot)"
/>
  );
}