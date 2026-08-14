import Link from "next/link";

interface ChallengeCtaProps {
  challengeId: string;
}

/** Links by id in the query string rather than assuming a /challenges/[id] route shape — the actual challenges route/page contents weren't part of this session's inspected files either, so this stays deliberately conservative. Confirm the real route shape before relying on this. */
export function ChallengeCta({ challengeId }: ChallengeCtaProps) {
  return (
    <Link
      href={`/challenges?open=${challengeId}`}
      className="rounded-sm bg-(--sr-crimson-hot) px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-white transition-opacity hover:opacity-90"
    >
      Proceed to Challenge
    </Link>
  );
}