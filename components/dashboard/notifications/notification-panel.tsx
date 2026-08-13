"use client";

import { CheckCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { NotificationItem } from "./notification-item";
import { NotificationEmpty } from "./notification-empty";
import { DashboardStagger, AnimatePresence } from "../motion/dashboard-stagger";
import { useNotifications } from "@/modules/notification/hooks/use-notifications";
import { useMarkNotificationAsRead } from "@/modules/notification/hooks/use-mark-notification-as-read";
import { useMarkAllNotificationsAsRead } from "@/modules/notification/hooks/use-mark-all-notifications-as-read";

/**
 * Only mounted while the popover is open (see dashboard-header.tsx's
 * `{open && <NotificationPanel />}`) — useNotifications() has no
 * `enabled` option, so conditional mounting is how this stays lazy
 * without duplicating or modifying the existing hook.
 *
 * markRead.mutate({ id }) — the mutation variable name is an assumption
 * (inferred from getNotification({ id })'s convention); the actual
 * schema file wasn't inspected. Verify before relying on this.
 */
export function NotificationPanel() {
  const { data, isLoading } = useNotifications(1, 10);
  const markRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();

  const notifications = data?.notifications ?? [];
  const hasUnread = notifications.some((n) => n.readAt === null);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-(--sr-border-subtle) px-3 py-2.5">
        <span className={cn("text-[11px] font-semibold tracking-[0.1em] uppercase", dashboardTheme.text.secondary, dashboardTheme.font.ui)}>
          Secure Transmissions
        </span>
        {hasUnread && (
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "ghost", size: "xs" }),
              "gap-1 bg-transparent text-[10px] hover:bg-(--sr-bg-surface-strong)",
              dashboardTheme.status.live,
            )}
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="size-3" aria-hidden="true" />
            Mark all read
          </button>
        )}
      </div>
      <ScrollArea className="max-h-80">
        <div className="p-1.5">
          {isLoading ? (
            <p className={cn("px-3 py-6 text-center text-[12px]", dashboardTheme.text.muted)}>Loading…</p>
          ) : notifications.length > 0 ? (
            <AnimatePresence initial={false}>
              <DashboardStagger className="flex flex-col gap-0.5">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkRead={(id) => markRead.mutate({ id })}
                    isPending={markRead.isPending}
                  />
                ))}
              </DashboardStagger>
            </AnimatePresence>
          ) : (
            <NotificationEmpty />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}