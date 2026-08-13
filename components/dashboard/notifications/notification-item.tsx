import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { srButtonIconGhost } from "../dashboard-button";
import { NotificationUnreadDot } from "./notification-unread";
import { DashboardStaggerItem } from "../motion/dashboard-stagger";
import type { NotificationDTO } from "@/modules/notification/types/notification.dto";

interface NotificationItemProps {
  notification: NotificationDTO;
  onMarkRead: (id: string) => void;
  isPending: boolean;
}

export function NotificationItem({
  notification,
  onMarkRead,
  isPending,
}: NotificationItemProps) {
  const unread = notification.readAt === null;

  return (
    <DashboardStaggerItem
      className={cn(
        "flex items-start gap-2 rounded-md p-2.5 transition-colors hover:bg-(--sr-bg-surface-strong)",
        unread && "bg-(--sr-bg-surface-strong)",
      )}
    >
      {unread ? (
        <NotificationUnreadDot />
      ) : (
        <span className="size-1.5 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[12px] font-medium",
            dashboardTheme.text.primary,
            dashboardTheme.font.ui,
          )}
        >
          {notification.title}
        </p>
        <p
          className={cn(
            "mt-0.5 line-clamp-2 text-[11px]",
            dashboardTheme.text.muted,
            dashboardTheme.font.body,
          )}
        >
          {notification.message}
        </p>
      </div>
      {unread && (
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-xs" }),
            srButtonIconGhost,
          )}
          aria-label="Mark as read"
          onClick={() => onMarkRead(notification.id)}
          disabled={isPending}
        >
          <Check className="size-3" aria-hidden="true" />
        </button>
      )}
    </DashboardStaggerItem>
  );
}
