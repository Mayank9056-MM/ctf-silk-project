
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

interface StoryUnavailableProps {
  /** The backend's own user-safe message (e.g. "The event hasn't started yet.") — displayed verbatim, never re-derived or string-matched client-side into a synthetic status enum. */
  message: string;
}

export function StoryUnavailable({ message }: StoryUnavailableProps) {
  return (
    <div className={cn("flex h-dvh flex-col items-center justify-center gap-3 px-6 text-center", storyTheme.background.void)}>
      <p className={cn("text-[11px] tracking-[0.24em] uppercase", storyTheme.accent.investigation, storyTheme.font.mono)}>
        Investigation Currently Unavailable
      </p>
      <p className={cn("max-w-[38ch] text-[13px] italic", storyTheme.text.secondary, storyTheme.font.body)}>{message}</p>
    </div>
  );
}