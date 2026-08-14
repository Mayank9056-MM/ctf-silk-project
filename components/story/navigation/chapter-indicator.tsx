
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

export function ChapterIndicator({ order, title }: { order: number; title: string }) {
  return (
    <span className={cn("text-[10px] tracking-[0.14em] uppercase", storyTheme.text.muted, storyTheme.font.mono)}>
      Ch. {String(order).padStart(2, "0")} — {title}
    </span>
  );
}