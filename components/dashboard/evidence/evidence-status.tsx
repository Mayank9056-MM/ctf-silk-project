import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";

export function EvidenceStatus({ recovered, total }: { recovered: number; total: number }) {
  return (
    <span className={cn("text-[13px] tabular-nums", dashboardTheme.text.primary, dashboardTheme.font.mono)}>
      {recovered} / {total} Recovered
    </span>
  );
}