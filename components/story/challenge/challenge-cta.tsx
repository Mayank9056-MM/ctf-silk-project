// components/story/challenge/challenge-cta.tsx
import Link from "next/link";

interface ChallengeCtaProps {
  challengeId: string;
}

/**
 * CORRECTED: previously linked to `/challenges?open=${challengeId}`, a
 * conservative placeholder written before the real player challenge
 * route existed — flagged explicitly at the time as needing
 * confirmation. The real route is
 * app/(protected)/challenges/[challengeId]/page.tsx, confirmed id-based
 * (not slug-based) because Scene.challengeId — the only thing this
 * component's caller ever has — is a raw Challenge.id FK, never a slug.
 */
export function ChallengeCta({ challengeId }: ChallengeCtaProps) {
  return (
    <Link
      href={`/challenges/${challengeId}`}
      className="rounded-sm bg-(--sr-crimson-hot) px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-white transition-opacity hover:opacity-90"
    >
      Proceed to Challenge
    </Link>
  );
}