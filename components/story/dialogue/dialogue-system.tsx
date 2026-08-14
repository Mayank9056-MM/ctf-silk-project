"use client";

import { CharacterTransition } from "../character/character-transition";
import { DialogueLine } from "./dialogue-line";
import { useDialogueController } from "../hooks/use-dialogue-controller";
import type { DialogueLineDTO } from "@/modules/story/types/dialogue.dto";

interface DialogueSystemProps {
  lines: DialogueLineDTO[];
  onSequenceComplete: () => void;
}

export function DialogueSystem({ lines, onSequenceComplete }: DialogueSystemProps) {
  const { currentLine, displayedText, phase, lineIndex, totalLines, advance } = useDialogueController(lines);

  function handleAdvance() {
    if (phase === "line-complete" && lineIndex + 1 >= totalLines) {
      advance();
      onSequenceComplete();
      return;
    }
    advance();
  }

  if (!currentLine) return null;

  return (
    <CharacterTransition speakerKey={currentLine.speaker?.displayName ?? `narration-${lineIndex}`}>
      <DialogueLine
        line={currentLine}
        displayedText={displayedText}
        phase={phase}
        lineIndex={lineIndex}
        totalLines={totalLines}
        onAdvance={handleAdvance}
      />
    </CharacterTransition>
  );
}