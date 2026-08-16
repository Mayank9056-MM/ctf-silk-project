// components/challenge/objective/challenge-objective.tsx
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";

/**
 * Static, non-DTO-sourced copy. PlayerChallengeDTO has no description
 * field — this deliberately does NOT invent per-challenge briefing text.
 * The wording below is the spec's own literal example, used as-is.
 */
export function ChallengeObjective() {
  return (
    <section className={cn("rounded-lg border p-4", storyTheme.border.subtle)}>
      <h2 className={cn("mb-2 text-[11px] tracking-[0.16em] uppercase", storyTheme.accent.investigation, storyTheme.font.mono)}>
        Objective
      </h2>
      <p className={cn("text-[13px] leading-relaxed", storyTheme.text.secondary, storyTheme.font.body)}>
        Analyze the attached evidence and identify the required flag.
      </p>
    </section>
  );
}