
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

/** A quiet "already seen this" indicator on a scene's own render (SceneDTO.isCompleted) — not the full completion/* screens, which handle chapter/story-level completion instead. */
export function SceneCompletionBadge({ isCompleted }: { isCompleted: boolean }) {
  if (!isCompleted) return null;
  return (
    <span className={cn("text-[9px] tracking-[0.1em] uppercase", storyTheme.text.muted, storyTheme.font.mono)}>
      Previously Reviewed
    </span>
  );
}