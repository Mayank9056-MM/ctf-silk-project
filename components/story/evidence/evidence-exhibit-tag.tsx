import { storyTheme } from "@/components/story/story-theme";
import { cn } from "@/lib/utils";

export function EvidenceExhibitTag({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-[2px] border px-1.5 py-0.5 text-[8px] font-bold tracking-[0.1em] uppercase",
        storyTheme.border.normal,
        storyTheme.text.muted,
        storyTheme.font.mono,
      )}
    >
      Exhibit {label}
    </span>
  );
}