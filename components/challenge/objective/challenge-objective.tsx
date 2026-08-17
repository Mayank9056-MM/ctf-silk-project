// components/challenge/objective/challenge-objective.tsx
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";

interface ChallengeObjectiveProps {
  description: string;
}

/**
 * CHANGED: previously rendered static, non-DTO-sourced copy because
 * PlayerChallengeDTO had no description field. Now renders the real
 * per-challenge `description` from the backend. Falls back to the old
 * static line only when description is empty (a challenge seeded before
 * this field existed, or a genuine authoring gap) — never silently
 * renders nothing, but also never fabricates specific content the
 * backend didn't provide.
 */
export function ChallengeObjective({ description }: ChallengeObjectiveProps) {
  const content = description.trim().length > 0
    ? description
    : "Analyze the attached evidence and identify the required flag.";

  return (
    <section className={cn("rounded-lg border p-4", storyTheme.border.subtle)}>
      <h2 className={cn("mb-2 text-[11px] tracking-[0.16em] uppercase", storyTheme.accent.investigation, storyTheme.font.mono)}>
        Objective
      </h2>
      <p className={cn("text-[13px] leading-relaxed", storyTheme.text.secondary, storyTheme.font.body)}>
        {content}
      </p>
    </section>
  );
}