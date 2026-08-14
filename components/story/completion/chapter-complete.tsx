
import { cn } from "@/lib/utils";
import { CompletionTransition } from "./completion-transition";
import { storyTheme } from "../story-theme";

export function ChapterComplete({ chapterTitle }: { chapterTitle: string }) {
  return (
    <CompletionTransition>
      <span className={cn("text-[11px] tracking-[0.24em] uppercase", storyTheme.accent.crimson, storyTheme.font.mono)}>
        Chapter Complete
      </span>
      <h2 className={cn("text-2xl font-bold", storyTheme.text.primary, storyTheme.font.display)}>{chapterTitle}</h2>
    </CompletionTransition>
  );
}