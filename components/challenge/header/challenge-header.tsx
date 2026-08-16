// components/challenge/header/challenge-header.tsx
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";

interface ChallengeHeaderProps {
  title: string;
  /** Displayed as the case identifier — no internal database id is ever
   * exposed here, only the player-safe slug already present on the DTO. */
  slug: string;
}

export function ChallengeHeader({ title, slug }: ChallengeHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <div className="sr-case-row">
        <span className="sr-case-badge">
          <span className="sr-case-dot" aria-hidden="true" />
          <span className="sr-case-inline">{slug}</span>
        </span>
      </div>
      <h1
        className={cn(
          "text-2xl font-semibold tracking-tight sm:text-3xl",
          storyTheme.text.primary,
          storyTheme.font.display,
        )}
      >
        {title}
      </h1>
    </header>
  );
}