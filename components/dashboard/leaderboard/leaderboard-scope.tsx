import { cn } from "@/lib/utils";
import { srBadgeBase, srBadgeGold, srBadgeTeal } from "../dashboard-badge";

export function LeaderboardScope({ scope }: { scope: "LIVE" | "FROZEN" }) {
  return (
    <span className={cn(srBadgeBase, scope === "FROZEN" ? srBadgeGold : srBadgeTeal)}>
      {scope}
    </span>
  );
}