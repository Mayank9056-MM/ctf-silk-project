import { DashboardPanel } from "../dashboard-panel";
import { InvestigationStat } from "./investigation-stat";
import { ChallengeStat } from "./challenge-stat";
import { EvidenceStat } from "./evidence-stat";
import { RankStat } from "./rank-stat";
import type { DashboardDTO } from "@/modules/dashboard/types/dashboard.dto";

/** gap-0 + per-child border-left reads as one continuous intelligence readout rather than four separate cards touching edges — matches spec section 13's "hierarchy, not generic cards" instruction. */
export function IntelligenceOverview({ data }: { data: DashboardDTO }) {
  return (
    <DashboardPanel className="sr-dash-anim-intel grid grid-cols-4 gap-0 [&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-(--sr-border-subtle) [&>*:not(:first-child)]:pl-6 [&>*:not(:last-child)]:pr-6">
      <InvestigationStat investigation={data.investigation} />
      <ChallengeStat challenges={data.challenges} />
      <EvidenceStat evidence={data.evidence} />
      <RankStat rank={data.rank} />
    </DashboardPanel>
  );
}