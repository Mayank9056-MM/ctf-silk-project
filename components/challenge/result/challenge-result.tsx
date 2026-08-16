// components/challenge/result/challenge-result.tsx
"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";
import { CheckCircle2 } from "lucide-react";

import type { SubmitFlagResultDTO } from "@/modules/submission/types/submission.dto";
import { useStoryNavigation } from "@/components/story/hooks/use-story-navigation";

interface ChallengeResultProps {
  mutation: UseMutationResult<SubmitFlagResultDTO, Error, { challengeId: string; flag: string }>;
  xpReward: number;
}

/**
 * Renders only for the "solved" outcomes (correct or alreadySolved).
 * Everything else (incorrect / rate-limited / unavailable / generic
 * error) is handled inline inside ChallengeFlagForm itself, next to the
 * input that produced it — this component is deliberately narrow.
 *
 * xpAwarded always comes from the server response, never recomputed
 * from the `xpReward` prop. When alreadySolved is true, xpAwarded is
 * 0 by contract (see SubmissionService.isDuplicateSolve) and this
 * renders that fact plainly rather than showing the challenge's nominal
 * reward as though it was just earned again.
 */
export function ChallengeResult({ mutation }: ChallengeResultProps) {
  const { continueInvestigation } = useStoryNavigation();

  if (!mutation.isSuccess || !mutation.data.isCorrect) return null;

  const { xpAwarded, alreadySolved } = mutation.data;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-in fade-in zoom-in-95 duration-300 flex flex-col items-start gap-3 rounded-lg border p-5",
        "border-(--sr-investigation-blue) bg-(--sr-bg-surface)",
      )}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-5 text-(--sr-investigation-blue)" aria-hidden="true" />
        <p className={cn("text-sm font-semibold tracking-[0.08em] uppercase", storyTheme.text.primary, storyTheme.font.ui)}>
          Challenge Solved
        </p>
      </div>

      <p className={cn("text-[13px]", storyTheme.text.secondary, storyTheme.font.body)}>
        {alreadySolved ? "Evidence already verified." : "Evidence verified."}
      </p>

      {!alreadySolved && (
        <p className="text-lg font-semibold text-(--sr-crimson-hot)">+{xpAwarded} XP</p>
      )}

      <button
        type="button"
        onClick={continueInvestigation}
        className="mt-1 rounded-md bg-(--sr-crimson-hot) px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-white transition-opacity hover:opacity-90"
      >
        Continue Investigation
      </button>
    </div>
  );
}