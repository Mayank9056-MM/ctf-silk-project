import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";

interface InvestigationProgressProps {
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
}

export function InvestigationProgress({ progressPercent, completedChapters, totalChapters }: InvestigationProgressProps) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <Progress
        value={progressPercent}
        className="h-1 max-w-[220px] [&_[data-slot=progress-track]]:bg-(--sr-bg-surface-strong) [&_[data-slot=progress-indicator]]:bg-(--sr-crimson)"
      />
      <span className={cn("text-[10.5px] tabular-nums", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
        {completedChapters}/{totalChapters} chapters · {progressPercent}%
      </span>
    </div>
  );
}