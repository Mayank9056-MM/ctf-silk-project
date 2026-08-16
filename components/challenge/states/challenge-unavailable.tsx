// components/challenge/states/challenge-unavailable.tsx
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";
import Link from "next/link";

/**
 * Rendered for every access-denial reason ChallengeAccessService can
 * produce — they're indistinguishable by design past the server
 * boundary. Never says "you haven't unlocked this" or references
 * prerequisites/current scene, per spec.
 */
export function ChallengeUnavailable() {
  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center",
        storyTheme.background.void,
      )}
    >
      <p className={cn("text-[11px] tracking-[0.24em] uppercase", storyTheme.accent.investigation, storyTheme.font.mono)}>
        Challenge Unavailable
      </p>
      <p className={cn("max-w-[38ch] text-[13px]", storyTheme.text.secondary, storyTheme.font.body)}>
        This investigation node is not currently available.
      </p>
      <Link
        href="/story"
        className={cn(
          "mt-1 rounded-sm border px-5 py-2.5 text-[11px] tracking-[0.1em] uppercase transition-colors hover:border-(--sr-crimson-hot) hover:text-(--sr-crimson-hot)",
          storyTheme.border.normal,
          storyTheme.text.secondary,
        )}
      >
        Return to Investigation
      </Link>
    </div>
  );
}