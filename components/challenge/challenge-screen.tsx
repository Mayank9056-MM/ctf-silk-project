// components/challenge/challenge-screen.tsx
"use client";

import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";
import { useChallenge } from "@/modules/challenge/hooks/use-challenge";

import { ChallengeBackLink } from "./navigation/challenge-back-link";
import { ChallengeHeader } from "./header/challenge-header";
import { ChallengeMetadata } from "./header/challenge-metadata";
import { ChallengeObjective } from "./objective/challenge-objective";
import { ChallengeAttachments } from "./attachments/challenge-attachments";
import { ChallengeFlagPanel } from "./flag-form/challenge-flag-panel";
import { ChallengeLoading } from "./states/challenge-loading";
import { ChallengeUnavailable } from "./states/challenge-unavailable";
import { ChallengeError } from "./states/challenge-error";
import { ChallengeHints } from "./hints/challenge-hints";

interface ChallengeScreenProps {
  challengeId: string;
}

export function ChallengeScreen({ challengeId }: ChallengeScreenProps) {
  const {
    data: challenge,
    isLoading,
    isError,
    error,
    refetch,
  } = useChallenge(challengeId);

  if (isLoading) return <ChallengeLoading />;

  if (isError) {
    const message = error instanceof Error ? error.message : null;
    return message ? (
      <ChallengeUnavailable />
    ) : (
      <ChallengeError onRetry={() => refetch()} />
    );
  }

  if (!challenge) return <ChallengeError onRetry={() => refetch()} />;

  return (
    <div className={cn("min-h-dvh", storyTheme.background.void)}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10 sm:px-8 sm:py-14">
        <ChallengeBackLink />

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col gap-4">
          <ChallengeHeader title={challenge.title} slug={challenge.slug} />
          <ChallengeMetadata
            difficulty={challenge.difficulty}
            xpReward={challenge.xpReward}
          />
        </div>

        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
        >
          <ChallengeObjective description={challenge.description} />
        </div>

        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "160ms", animationFillMode: "backwards" }}
        >
          <ChallengeAttachments attachments={challenge.attachments} />
        </div>

        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "220ms", animationFillMode: "backwards" }}
        >
          <ChallengeHints challengeId={challenge.id} />
        </div>

        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "240ms", animationFillMode: "backwards" }}
        >
          <ChallengeFlagPanel
            challengeId={challenge.id}
            xpReward={challenge.xpReward}
          />
        </div>
      </div>
    </div>
  );
}