// components/challenge/flag-form/challenge-flag-panel.tsx
"use client";

import { ChallengeResult } from "../result/challenge-result";
import { useSubmitFlag } from "@/modules/submission/hooks/use-submit-flag";
import { ChallengeFlagForm } from "./challenge-flag-form";

interface ChallengeFlagPanelProps {
  challengeId: string;
  xpReward: number;
}

/**
 * Owns the single useSubmitFlag() mutation instance and switches between
 * the form and the result view based on its state — the form disappears
 * once a submission has resolved to `correct`/`alreadySolved`, per spec
 * ("Do not implement retry loops" + no reason to keep the input around
 * once the challenge is solved). Any other resolved state (`incorrect`,
 * rate-limited, unavailable, generic error) shows the result inline
 * ABOVE the form, and the form stays interactive so the player can
 * immediately try again — mutation.reset() clears it back to idle.
 */
export function ChallengeFlagPanel({ challengeId, xpReward }: ChallengeFlagPanelProps) {
  const mutation = useSubmitFlag();

  const solved = mutation.isSuccess && mutation.data.isCorrect;

  return (
    <section className="flex flex-col gap-4">
      <ChallengeResult mutation={mutation} xpReward={xpReward} />
      {!solved && <ChallengeFlagForm challengeId={challengeId} mutation={mutation} />}
    </section>
  );
}