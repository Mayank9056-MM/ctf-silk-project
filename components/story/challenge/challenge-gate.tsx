
import { cn } from "@/lib/utils";

import { ChallengeCta } from "./challenge-cta";
import { SceneKicker } from "../scene/scene-kicker";
import { ChallengeTransition } from "../transitions/challenge-transition";
import { storyTheme } from "../story-theme";

interface ChallengeGateProps {
  challengeId: string;
}

/** Never fetches or reflects challenge completion state client-side — per spec, "do not assume challenge completion from client state." This scene simply stays visible until the player's next getCurrentScene() call reflects a real backend-confirmed transition (via unlock rules on the following scene), which happens naturally on next navigation/refetch, not something this component drives itself. */
export function ChallengeGate({ challengeId }: ChallengeGateProps) {
  return (
    <ChallengeTransition>
      <div className="flex flex-col gap-3">
        <SceneKicker>Case File — Challenge Required</SceneKicker>
        <p className={cn("text-[13px]", storyTheme.text.secondary, storyTheme.font.body)}>
          The investigation cannot proceed until this is resolved.
        </p>
        <ChallengeCta challengeId={challengeId} />
      </div>
    </ChallengeTransition>
  );
}