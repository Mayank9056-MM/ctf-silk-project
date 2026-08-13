import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { AnnouncementPriorityBadge } from "./announcement-priority";
import { DashboardStaggerItem } from "../motion/dashboard-stagger";
import type { AnnouncementDTO } from "@/modules/announcement/types/announcement.dto";

export function AnnouncementItem({ announcement }: { announcement: AnnouncementDTO }) {
  return (
    <DashboardStaggerItem className="flex items-baseline gap-2 py-1.5">
      <AnnouncementPriorityBadge priority={announcement.priority} />
      <span className={cn("text-[12px]", dashboardTheme.text.secondary, dashboardTheme.font.body)}>{announcement.title}</span>
    </DashboardStaggerItem>
  );
}