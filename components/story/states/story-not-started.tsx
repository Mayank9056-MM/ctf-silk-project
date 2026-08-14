
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

interface StoryNotStartedProps {
  onBegin: () => void;
  isPending: boolean;
}

/**
 * Currently unreachable in practice: getCurrentScene() always bootstraps
 * a fresh StoryProgress row on first call (see storyNavigationService's
 * own doc comment), so a signed-in player never actually observes a
 * "not started" response from that endpoint — they're handed scene one
 * directly. Kept as a real, wired component per the spec's explicit
 * file list rather than omitted, in case a future entry point (e.g. a
 * landing screen that checks status before calling getCurrentScene)
 * needs it — but nothing in this build currently renders it.
 */
export function StoryNotStarted({ onBegin, isPending }: StoryNotStartedProps) {
  return (
    <div className={cn("flex h-dvh flex-col items-center justify-center gap-5 px-6 text-center", storyTheme.background.void)}>
      <p className={cn("text-[11px] tracking-[0.24em] uppercase", storyTheme.accent.crimson, storyTheme.font.mono)}>
        Case File Sealed
      </p>
      <h1 className={cn("text-2xl font-bold", storyTheme.text.primary, storyTheme.font.display)}>
        The Silk Road Investigation
      </h1>
      <button
        type="button"
        onClick={onBegin}
        disabled={isPending}
        className="rounded-sm bg-(--sr-crimson-hot) px-6 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Opening Case File…" : "Begin Investigation"}
      </button>
    </div>
  );
}