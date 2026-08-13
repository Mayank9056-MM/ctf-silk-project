import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { DashboardPanel, DashboardPanelTitle } from "../dashboard-panel";
import { AnnouncementItem } from "./announcement-item";
import { DashboardStagger } from "../motion/dashboard-stagger";
import type { AnnouncementDTO } from "@/modules/announcement/types/announcement.dto";

export function AnnouncementPanel({ announcements }: { announcements: AnnouncementDTO[] }) {
  return (
    <DashboardPanel className="sr-dash-anim-secondary">
      <DashboardPanelTitle>Intelligence Bulletins</DashboardPanelTitle>
      {announcements.length > 0 ? (
        <DashboardStagger className="flex flex-col divide-y divide-(--sr-border-subtle)">
          {announcements.map((a) => (
            <AnnouncementItem key={a.id} announcement={a} />
          ))}
        </DashboardStagger>
      ) : (
        <p className={cn("text-[12px]", dashboardTheme.text.muted, dashboardTheme.font.body)}>No active bulletins.</p>
      )}
    </DashboardPanel>
  );
}