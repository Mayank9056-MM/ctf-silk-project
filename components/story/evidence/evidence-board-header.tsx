import { storyTheme } from "@/components/story/story-theme";
import { cn } from "@/lib/utils";
import type { ChapterDTO } from "@/modules/story/types/chapter.dto";

interface EvidenceBoardHeaderProps {
  chapter: ChapterDTO;
  recovered: number;
  total: number;
}

export function EvidenceBoardHeader({ chapter, recovered, total }: EvidenceBoardHeaderProps) {
  return (
    <div className="mb-10 flex items-end justify-between border-b border-(--sr-border-subtle) pb-4">
      <div className="flex flex-col gap-1">
        <span className={cn("text-[10px] tracking-[0.24em] uppercase", storyTheme.accent.crimson, storyTheme.font.mono)}>
          Investigation Board
        </span>
        <h1 className={cn("text-xl font-bold", storyTheme.text.primary, storyTheme.font.display)}>
          Chapter {String(chapter.order).padStart(2, "0")} — {chapter.title}
        </h1>
      </div>
      <span className={cn("text-[11px] tabular-nums tracking-[0.08em]", storyTheme.text.secondary, storyTheme.font.mono)}>
        {recovered} / {total} Recovered
      </span>
    </div>
  );
}