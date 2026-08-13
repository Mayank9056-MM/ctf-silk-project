import { cn } from "@/lib/utils";
import { srBadgeBase, srBadgeGold } from "../dashboard-badge";
import { IntelligenceStat } from "./intelligence-stat";
import type { DashboardRankDTO } from "@/modules/dashboard/types/dashboard.dto";

export function RankStat({ rank }: { rank: DashboardRankDTO }) {
  return (
    <IntelligenceStat
      label="Standing"
      value={rank.rank !== null ? `#${rank.rank}` : "Unranked"}
      context={`${rank.totalXp.toLocaleString()} XP`}
      accentClassName="bg-(--sr-steel)"
      indicator={rank.isFrozen ? <span className={cn(srBadgeBase, srBadgeGold)}>Frozen</span> : undefined}
    />
  );
}