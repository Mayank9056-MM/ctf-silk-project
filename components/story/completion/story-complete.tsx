import Link from "next/link";
import { cn } from "@/lib/utils";
import { CompletionTransition } from "./completion-transition";
import { storyTheme } from "../story-theme";

/** Rendered when progress.status is the "completed" value and scene === null, per StoryStateDTO's own doc comment — the exact StoryProgressStatus literal is blocker #2; the caller (story-screen.tsx) is what checks it, this component just presents the resulting state. */
export function StoryComplete() {
  return (
    <CompletionTransition>
      <span className={cn("text-[11px] tracking-[0.24em] uppercase", storyTheme.accent.crimson, storyTheme.font.mono)}>
        Investigation Complete
      </span>
      <p className={cn("max-w-[36ch] text-[13px] italic", storyTheme.text.secondary, storyTheme.font.body)}>
        People lie. Evidence doesn&apos;t.
      </p>
      <Link
        href="/leaderboard"
        className="mt-2 rounded-sm border border-(--sr-border-normal) px-5 py-2.5 text-[11px] uppercase tracking-[0.1em] text-(--sr-text-secondary) hover:text-(--sr-text-primary)"
      >
        View Standings
      </Link>
    </CompletionTransition>
  );
}