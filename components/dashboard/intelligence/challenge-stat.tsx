import { IntelligenceStat } from "./intelligence-stat";
import type { DashboardChallengesDTO } from "@/modules/dashboard/types/dashboard.dto";

export function ChallengeStat({ challenges }: { challenges: DashboardChallengesDTO }) {
  return <IntelligenceStat
  label="Challenges"
  value={String(challenges.solved)}
  context={`${challenges.xp.toLocaleString()} XP earned`}
  accentClassName="bg-(--sr-gold)"
/>;
}