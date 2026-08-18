import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "@/components/dashboard/dashboard-theme";

/**
 * Same pattern as ChallengeBackLink/EvidenceBoardBackLink — plain link,
 * no button chrome, brightens to crimson on hover. Single destination
 * (/dashboard), matching ChallengeBackLink's reasoning rather than
 * EvidenceBoardBackLink's two-path version: the leaderboard is a
 * standalone standings view, not something reached mid-flow from a
 * specific in-progress screen it should offer to return to.
 *
 * Uses dashboardTheme, not storyTheme (both back-links above use
 * storyTheme since they live in story/challenge screens) — the
 * leaderboard page is dashboard-family, so it stays consistent with
 * every other component on this page (LeaderboardHero, LeaderboardPanel,
 * etc.) which all read from dashboardTheme.
 */
export function LeaderboardBackLink() {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "inline-flex w-fit items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase transition-colors hover:text-(--sr-crimson-hot)",
        dashboardTheme.text.muted,
        dashboardTheme.font.mono,
      )}
    >
      <ArrowLeft className="size-3.5" aria-hidden="true" />
      Back to Dashboard
    </Link>
  );
}