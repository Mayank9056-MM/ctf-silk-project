// app/(protected)/challenges/[challengeId]/page.tsx
// Delete the old app/(protected)/challenges/[challengeSlug]/ folder —
// this replaces it.
import { ChallengeScreen } from "@/components/challenge/challenge-screen";

interface ChallengePageProps {
  params: Promise<{ challengeId: string }>;
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { challengeId } = await params;

  return <ChallengeScreen challengeId={challengeId} />;
}