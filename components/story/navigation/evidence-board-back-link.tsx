// components/story/navigation/evidence-board-back-link.tsx
import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";

/**
 * Two return paths for the evidence board, not one. Unlike
 * ChallengeBackLink (which only ever offers /dashboard, because a
 * challenge is reached FROM a story gate and "back" during an active
 * submission attempt should land somewhere stable, not re-trigger
 * Story's scene machinery), the evidence board is a passive review
 * screen a player can reach mid-investigation — there's nothing
 * in-progress to protect by picking only one destination. No
 * confirmation step (unlike ExitStory): leaving this screen can't lose
 * or interrupt anything, so a dialog here would be pure friction.
 */
export function EvidenceBoardBackLink() {
  return (
    <nav aria-label="Evidence board navigation" className="flex flex-wrap items-center gap-4">
      <Link
        href="/story"
        className={cn(
          "inline-flex w-fit items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase transition-colors hover:text-(--sr-crimson-hot)",
          storyTheme.text.muted,
          storyTheme.font.mono,
        )}
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Return to Story
      </Link>

      <Link
        href="/dashboard"
        className={cn(
          "inline-flex w-fit items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase transition-colors hover:text-(--sr-crimson-hot)",
          storyTheme.text.muted,
          storyTheme.font.mono,
        )}
      >
        <LayoutDashboard className="size-3.5" aria-hidden="true" />
        Return to Dashboard
      </Link>
    </nav>
  );
}