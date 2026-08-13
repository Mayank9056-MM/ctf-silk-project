import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";

interface StatusItemProps {
  label: string;
  value: string;
  accentClassName?: string;
}

export function StatusItem({ label, value, accentClassName }: StatusItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className={cn("text-[9px] tracking-[0.16em] uppercase", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
        {label}
      </span>
      <span className={cn("text-lg font-semibold tabular-nums", accentClassName ?? dashboardTheme.text.primary, dashboardTheme.font.display)}>
        {value}
      </span>
    </div>
  );
}