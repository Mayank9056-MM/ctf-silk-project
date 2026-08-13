import { Progress } from "@/components/ui/progress";

export function EvidenceProgress({ progressPercent }: { progressPercent: number }) {
  return (
    <Progress
      value={progressPercent}
      className="sr-progress-glow-teal mt-2 h-1 [&_[data-slot=progress-track]]:bg-(--sr-bg-surface-strong) [&_[data-slot=progress-indicator]]:bg-(--sr-teal-hot)"
    />
  );
}