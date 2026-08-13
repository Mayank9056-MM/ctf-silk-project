import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";

export function NotificationEmpty() {
  return <p className={cn("px-3 py-6 text-center text-[12px]", dashboardTheme.text.muted, dashboardTheme.font.body)}>No new transmissions.</p>;
}