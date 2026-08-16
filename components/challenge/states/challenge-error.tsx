// components/challenge/states/challenge-error.tsx
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";

interface ChallengeErrorProps {
  onRetry: () => void;
}

/** Same shape as StoryError — network/unexpected failure, not a backend-
 * communicated state, so this gets a retry rather than fixed copy. */
export function ChallengeError({ onRetry }: ChallengeErrorProps) {
  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center",
        storyTheme.background.void,
      )}
    >
      <p className={cn("text-[11px] tracking-[0.24em] uppercase", storyTheme.accent.crimson, storyTheme.font.mono)}>
        Evidence Could Not Be Retrieved
      </p>
      <p className={cn("max-w-[36ch] text-[13px]", storyTheme.text.secondary, storyTheme.font.body)}>
        The connection to the investigation was interrupted.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "mt-1 rounded-sm border px-5 py-2.5 text-[11px] tracking-[0.1em] uppercase transition-colors hover:border-(--sr-crimson-hot) hover:text-(--sr-crimson-hot)",
          storyTheme.border.normal,
          storyTheme.text.secondary,
        )}
      >
        Reconnect
      </button>
    </div>
  );
}