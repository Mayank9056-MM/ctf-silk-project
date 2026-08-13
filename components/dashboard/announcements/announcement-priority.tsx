import { cn } from "@/lib/utils";
import { srBadgeBase, srBadgeCrimson, srBadgeGold, srBadgeSteel } from "../dashboard-badge";
import type { AnnouncementPriority } from "@/app/generated/prisma/enums";

/** Real enum members still unconfirmed (see earlier flag) — defensive string matching, unchanged logic, just pill styling instead of bare text. */
export function AnnouncementPriorityBadge({ priority }: { priority: AnnouncementPriority }) {
  const p = String(priority).toUpperCase();
  const accent = p.includes("CRIT") || p.includes("URGENT") || p.includes("HIGH")
    ? srBadgeCrimson
    : p.includes("LOW")
      ? srBadgeSteel
      : srBadgeGold;

  return <span className={cn(srBadgeBase, accent)}>{String(priority)}</span>;
}