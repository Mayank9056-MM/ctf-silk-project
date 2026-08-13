"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { srButtonIconGhost } from "../dashboard-button";
import { DashboardBrand } from "./dashboard-brand";
import { DashboardCaseMeta } from "./dashboard-case-meta";
import { DashboardCountdown } from "./dashboard-countdown";
import { DashboardEventStatus } from "./dashboard-event-status";
import { NotificationPanel } from "../notifications/notification-panel";
import { PlayerMenu } from "./player-menu";
import type { DashboardEventDTO } from "@/modules/dashboard/types/dashboard.dto";

interface DashboardHeaderProps {
  event: DashboardEventDTO;
  unreadCount: number;
}

/**
 * `username` prop removed — it was sourced from requireAuth().name,
 * which is always undefined (see require-auth.ts's dead
 * payload.username read — the JWT payload never carries a username
 * field). PlayerMenu fetches the real, current username itself via
 * useSession() instead of trusting a value threaded down from a broken
 * source.
 */
export function DashboardHeader({ event, unreadCount }: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className={cn("sr-dash-anim-header flex items-center justify-between gap-6 border-b pb-4", dashboardTheme.border.subtle)}>
      <DashboardBrand />

      <div className="flex items-center gap-4">
        <DashboardEventStatus state={event.state} />
        <Separator orientation="vertical" className="h-4" />
        <DashboardCountdown event={event} />
      </div>

      <div className="flex items-center gap-4">
        <DashboardCaseMeta />
        <Separator orientation="vertical" className="h-4" />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), srButtonIconGhost, "relative")}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          >
            <Bell className={cn("size-4", dashboardTheme.text.secondary)} aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-(--sr-crimson-hot) text-[9px] font-bold text-white"
                aria-hidden="true"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className={cn("w-80 p-0", dashboardTheme.background.elevated, dashboardTheme.border.normal)}>
            {open && <NotificationPanel />}
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-4" />
        <PlayerMenu />
      </div>
    </header>
  );
}