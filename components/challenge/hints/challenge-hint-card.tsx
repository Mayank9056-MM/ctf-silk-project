"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";
import { Lock, Sparkles, Loader2 } from "lucide-react";

import { useUnlockHint } from "@/modules/hint/hooks/use-unlock-hint";
import { HINT_UNLOCK_ORDER } from "@/modules/hint/constants/hint.constants";
import type { ChallengeHintDTO } from "@/modules/hint/types/hint.dto";

interface ChallengeHintCardProps {
  hint: ChallengeHintDTO;
}

type HintDisplayState = "unlocked" | "locked" | "available" | "insufficient-xp";

/**
 * Pure presentational mapping of THREE already-authoritative server
 * booleans (unlocked / previousLevelUnlocked / canUnlock) onto a display
 * state. This does not recompute order or affordability — it only names
 * a combination of facts the server already decided. See hint.mapper.ts
 * for where previousLevelUnlocked comes from.
 */
function deriveDisplayState(hint: ChallengeHintDTO): HintDisplayState {
  if (hint.unlocked) return "unlocked";
  if (!hint.previousLevelUnlocked) return "locked";
  if (hint.canUnlock) return "available";
  return "insufficient-xp";
}

export function ChallengeHintCard({ hint }: ChallengeHintCardProps) {
  const mutation = useUnlockHint();
  const [isConfirming, setIsConfirming] = useState(false);

  // The unlock endpoint's own successful response already carries the
  // real, server-authoritative content for this exact hint — using it
  // here (rather than waiting for the invalidated list query to
  // refetch) isn't client-side guessing, it's the same data rendered a
  // beat earlier from the same authoritative source.
  const effectiveHint = mutation.data?.hint ?? hint;
  const state = deriveDisplayState(effectiveHint);
  const levelNumber = HINT_UNLOCK_ORDER.indexOf(effectiveHint.level) + 1;
  const levelLabel = `LEVEL ${String(levelNumber).padStart(2, "0")}`;

  function requestUnlock() {
    if (mutation.isPending) return;
    setIsConfirming(true);
  }

  function cancelUnlock() {
    setIsConfirming(false);
  }

  function confirmUnlock() {
    if (mutation.isPending) return;
    mutation.mutate(effectiveHint.id, {
      onSettled: () => setIsConfirming(false),
    });
  }

  return (
    <li
      className={cn(
        "list-none rounded-lg border p-4 transition-colors",
        state === "unlocked" ? "border-(--sr-investigation-blue)" : storyTheme.border.subtle,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {state === "locked" ? (
            <Lock className={cn("size-3.5", storyTheme.text.muted)} aria-hidden="true" />
          ) : (
            <Sparkles
              className={cn(
                "size-3.5",
                state === "unlocked" ? "text-(--sr-investigation-blue)" : storyTheme.text.muted,
              )}
              aria-hidden="true"
            />
          )}
          <span className={cn("text-[10px] tracking-[0.14em] uppercase", storyTheme.text.muted, storyTheme.font.mono)}>
            {levelLabel}
          </span>
        </div>

        <span className={cn("text-[11px] font-semibold", storyTheme.text.secondary, storyTheme.font.mono)}>
          {effectiveHint.xpCost > 0 ? `${effectiveHint.xpCost} XP` : "Free"}
        </span>
      </div>

      <p className={cn("mt-2 text-sm font-medium", storyTheme.text.primary, storyTheme.font.ui)}>
        {effectiveHint.title}
      </p>

      {state === "unlocked" && (
        <p className={cn("mt-2 text-[13px] leading-relaxed", storyTheme.text.secondary, storyTheme.font.body)}>
          {effectiveHint.content}
        </p>
      )}

      {state === "locked" && (
        <p className={cn("mt-2 text-[12px]", storyTheme.text.muted, storyTheme.font.body)}>
          Unlock the previous lead first.
        </p>
      )}

      {state === "insufficient-xp" && (
        <p className={cn("mt-2 text-[12px] text-(--sr-status-warning)", storyTheme.font.body)}>
          Not enough XP to reveal this lead yet.
        </p>
      )}

      <div id={`hint-${effectiveHint.id}-status`} role="status" aria-live="polite" className="mt-3 min-h-[1.5rem]">
        {state === "available" && !isConfirming && (
          <button
            type="button"
            onClick={requestUnlock}
            className="rounded-md bg-(--sr-crimson-hot) px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white transition-opacity hover:opacity-90"
          >
            Reveal Lead
          </button>
        )}

        {state === "available" && isConfirming && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-[12px]", storyTheme.text.secondary)}>
              Spend {effectiveHint.xpCost} XP to reveal this lead?
            </span>
            <button
              type="button"
              onClick={confirmUnlock}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 rounded-md bg-(--sr-crimson-hot) px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  Revealing
                </>
              ) : (
                "Confirm"
              )}
            </button>
            <button
              type="button"
              onClick={cancelUnlock}
              disabled={mutation.isPending}
              className={cn(
                "rounded-md border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                storyTheme.border.normal,
                storyTheme.text.secondary,
              )}
            >
              Cancel
            </button>
          </div>
        )}

        {mutation.isError && (
          <p className="text-[12px] text-(--sr-crimson-hot)">
            {mutation.error instanceof Error ? mutation.error.message : "Couldn't reveal this lead. Try again."}
          </p>
        )}
      </div>
    </li>
  );
}