"use client";

import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { useChallengeHints } from "@/modules/hint/hooks/use-challenge-hints";
import { ChallengeHintCard } from "./challenge-hint-card";

interface ChallengeHintsProps {
  challengeId: string;
}

/**
 * Localized failure domain: this component's own loading/error/empty
 * states never propagate up to ChallengeScreen. A hint-fetch failure
 * here leaves Header/Objective/Attachments/FlagPanel fully usable —
 * this is naturally isolated because useChallengeHints reports failure
 * through TanStack Query state (isError), not a thrown render error.
 */
export function ChallengeHints({ challengeId }: ChallengeHintsProps) {
  const { data, isLoading, isError, refetch, isFetching } = useChallengeHints(challengeId);

  if (isLoading) {
    return (
      <section className={cn("rounded-lg border p-4", storyTheme.border.subtle)}>
        <HintsHeader />
        <div className="mt-4 flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className={cn("rounded-lg border p-4", storyTheme.border.subtle)}>
        <HintsHeader />
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Leads unavailable</AlertTitle>
          <AlertDescription>
            Couldn&apos;t load investigative leads for this case.
          </AlertDescription>
        </Alert>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className={cn(
            "mt-3 rounded-md border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            storyTheme.border.normal,
            storyTheme.text.secondary,
          )}
        >
          {isFetching ? "Retrying…" : "Retry"}
        </button>
      </section>
    );
  }

  if (!data || data.hints.length === 0) return null;

  return (
    <section className={cn("rounded-lg border p-4", storyTheme.border.subtle)}>
      <HintsHeader />
      <ul className="mt-4 flex flex-col gap-3">
        {data.hints.map((hint) => (
          <ChallengeHintCard key={hint.id} hint={hint} />
        ))}
      </ul>
    </section>
  );
}

function HintsHeader() {
  return (
    <div>
      <h2
        className={cn(
          "text-[11px] tracking-[0.16em] uppercase",
          storyTheme.accent.investigation,
          storyTheme.font.mono,
        )}
      >
        Investigative Leads
      </h2>
      <p className={cn("mt-1 text-[13px] leading-relaxed", storyTheme.text.secondary, storyTheme.font.body)}>
        Need another angle? Leads reveal progressively and may cost XP.
      </p>
    </div>
  );
}