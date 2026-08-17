// components/challenge/navigation/challenge-back-link.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";

/**
 * Standalone back-nav for the challenge page — deliberately links to
 * /dashboard, not /story. A player arriving here came from a
 * CHALLENGE_GATE scene, but "back" during an active investigation
 * should return them somewhere stable and always-available rather than
 * re-triggering Story's own scene/transition machinery, which this
 * component has no business reaching into.
 */
export function ChallengeBackLink() {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "inline-flex w-fit items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase transition-colors hover:text-(--sr-crimson-hot)",
        storyTheme.text.muted,
        storyTheme.font.mono,
      )}
    >
      <ArrowLeft className="size-3.5" aria-hidden="true" />
      Back to Dashboard
    </Link>
  );
}