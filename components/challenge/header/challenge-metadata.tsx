// components/challenge/header/challenge-metadata.tsx
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";

interface ChallengeMetadataProps {
  /** Raw Int from the schema (default 1, no declared max) — deliberately
   * rendered as plain text rather than a N-of-5 dot scale, since the
   * backend gives no ceiling to calibrate a visual scale against. */
  difficulty: number;
  xpReward: number;
}

export function ChallengeMetadata({ difficulty, xpReward }: ChallengeMetadataProps) {
  return (
    <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-center gap-1.5">
        <dt className={cn("text-[10px] tracking-[0.14em] uppercase", storyTheme.text.muted, storyTheme.font.mono)}>
          Difficulty
        </dt>
        <dd className={cn("text-xs font-medium", storyTheme.text.secondary, storyTheme.font.ui)}>
          Level {difficulty}
        </dd>
      </div>
      <div className="flex items-center gap-1.5">
        <dt className={cn("text-[10px] tracking-[0.14em] uppercase", storyTheme.text.muted, storyTheme.font.mono)}>
          Reward
        </dt>
        <dd className={cn("text-xs font-medium text-(--sr-crimson-hot)", storyTheme.font.ui)}>
          +{xpReward} XP
        </dd>
      </div>
    </dl>
  );
}