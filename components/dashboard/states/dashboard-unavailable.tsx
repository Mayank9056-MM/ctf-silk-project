import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";

export function DashboardUnavailable({ label }: { label: string }) {
  return (
    <div className={cn("rounded-md border border-dashed p-3 text-center text-[11px]", dashboardTheme.border.normal, dashboardTheme.text.muted, dashboardTheme.font.mono)}>
      {label}
    </div>
  );
}