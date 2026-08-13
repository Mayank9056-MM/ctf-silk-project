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
import type { DashboardEventDTO } from "@/modules/dashboard/types/dashboard.dto";

interface DashboardHeaderProps {
  username: string;
  event: DashboardEventDTO;
  unreadCount: number;
}

/**
 * Notification trigger is styled directly with buttonVariants rather
 * than wrapping the Button component inside PopoverTrigger — Base UI's
 * Trigger already renders its own <button>; nesting Button inside it
 * would produce a nested-button violation (see phase 1 notes).
 *
 * Unread badge now uses --sr-crimson-hot (the hero's accent) instead of
 * the base --sr-accent — this is the one header element that gets the
 * cinematic-extension treatment, since it's the same "something needs
 * your attention" signal as the hero's kicker/CTA. Everything else in
 * the header (brand, case meta, event status dot) is untouched.
 *
 * Bell trigger explicitly colors both the button (srButtonIconGhost)
 * and the icon itself (dashboardTheme.text.secondary) — without the
 * icon override, <Bell> inherits currentColor from whatever
 * buttonVariants({variant:"ghost"}) sets as text color, which is the
 * unrouted light-mode foreground token, i.e. a dark icon on a dark
 * panel. Same bug class as the ghost/outline buttons fixed elsewhere.
 */
export function DashboardHeader({ username, event, unreadCount }: DashboardHeaderProps) {
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

        <span className={cn("text-[12.5px]", dashboardTheme.text.secondary, dashboardTheme.font.ui)}>{username}</span>
      </div>
    </header>
  );
}