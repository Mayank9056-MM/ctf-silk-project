
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";
import type { ChapterMapEntryDTO } from "@/modules/story/types/chapter.dto";
import { storyTheme } from "../story-theme";

export function ChapterMapNode({ chapter }: { chapter: ChapterMapEntryDTO }) {
  const isLocked = chapter.state === "LOCKED";
  const isActive = chapter.state === "ACTIVE";
  const isCompleted = chapter.state === "COMPLETED";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-full border transition-all",
          isLocked && "border-(--sr-border-subtle) opacity-40 blur-[0.5px]",
          isActive && "border-(--sr-crimson-hot) shadow-[0_0_0_3px_rgba(228,35,47,0.15)]",
          isCompleted && "border-(--sr-border-normal)",
        )}
      >
        {isLocked && <Lock className="size-3.5 text-(--sr-text-muted)" aria-hidden="true" />}
        {isCompleted && <Check className="size-3.5 text-(--sr-text-secondary)" aria-hidden="true" />}
        {isActive && <span className="size-2 animate-pulse rounded-full bg-(--sr-crimson-hot)" aria-hidden="true" />}
      </div>
      <span
        className={cn(
          "max-w-[80px] text-center text-[9px] tracking-[0.08em] uppercase",
          isLocked ? storyTheme.text.muted : storyTheme.text.secondary,
          storyTheme.font.mono,
        )}
      >
        {isLocked ? `Ch. ${String(chapter.order).padStart(2, "0")}` : chapter.title}
      </span>
    </div>
  );
}