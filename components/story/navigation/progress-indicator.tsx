
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

export function ProgressIndicator({ completedSceneCount }: { completedSceneCount: number }) {
  return (
    <span className={cn("text-[10px] tabular-nums tracking-[0.1em]", storyTheme.text.muted, storyTheme.font.mono)}>
      {completedSceneCount} scenes reviewed
    </span>
  );
}