import { storyTheme } from "@/components/story/story-theme";
import { cn } from "@/lib/utils";

export function StoryLoading() {
  return (
    <div
      className={cn(
        "flex h-dvh flex-col items-center justify-center gap-3",
        storyTheme.background.void,
      )}
    >
      <span
        className="size-1.5 animate-pulse rounded-full bg-(--sr-crimson-hot)"
        aria-hidden="true"
      />
      <p
        className={cn(
          "text-[11px] tracking-[0.24em] uppercase",
          storyTheme.text.muted,
          storyTheme.font.mono,
        )}
      >
        Establishing Secure Case Link…
      </p>
    </div>
  );
}
