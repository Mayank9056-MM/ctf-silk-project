import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";

export function DashboardEmpty({ message }: { message: string }) {
  return <p className={cn("text-[12px]", dashboardTheme.text.muted, dashboardTheme.font.body)}>{message}</p>;
}