"use client";

import { useState } from "react";
import { DialogueSystem } from "../dialogue/dialogue-system";
import { ChoicePanel } from "../choices/choice-panel";
import { ChallengeGate } from "../challenge/challenge-gate";
import { useAdvanceScene } from "@/modules/story/hooks/use-advance-scene";
import type { SceneDTO } from "@/modules/story/types/scene.dto";
import { EvidenceReveal } from "../transitions/evidence-reveal";

interface SceneContentProps {
  scene: SceneDTO;
}

type Beat = "dialogue" | "evidence" | "resolution";

export function SceneContent({ scene }: SceneContentProps) {
  const [beat, setBeat] = useState<Beat>(() => {
    if (scene.dialogueLines.length > 0) return "dialogue";
    if (scene.evidence) return "evidence";
    return "resolution";
  });
  const advanceScene = useAdvanceScene();

  if (beat === "dialogue") {
    return (
      <DialogueSystem
        lines={scene.dialogueLines}
        onSequenceComplete={() => setBeat(scene.evidence ? "evidence" : "resolution")}
      />
    );
  }

  if (beat === "evidence" && scene.evidence) {
    return <EvidenceReveal evidence={scene.evidence} onContinue={() => setBeat("resolution")} />;
  }

  if (scene.choices.length > 0) {
    return <ChoicePanel currentSceneId={scene.id} choices={scene.choices} />;
  }

  if (scene.challengeId) {
    return <ChallengeGate challengeId={scene.challengeId} />;
  }

  return (
    <button
      type="button"
      onClick={() => advanceScene.mutate(scene.id)}
      disabled={advanceScene.isPending}
      className="self-start rounded-sm bg-(--sr-crimson-hot) px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {advanceScene.isPending ? "Advancing…" : "Continue Investigation"}
    </button>
  );
}