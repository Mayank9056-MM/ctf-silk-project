
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

interface DialogueProgressProps {
  lineIndex: number;
  totalLines: number;
}

export function DialogueProgress({ lineIndex, totalLines }: DialogueProgressProps) {
  if (totalLines <= 1) return null;
  return (
    <div className="flex gap-1" aria-hidden="true">
      {Array.from({ length: totalLines }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-[3px] w-4 rounded-full transition-colors",
            i <= lineIndex ? "bg-(--sr-crimson-hot)" : storyTheme.background.surface,
          )}
        />
      ))}
    </div>
  );
}