import { DialogueTypewriter } from "./dialogue-typewriter";
import { DialogueAudio } from "./dialogue-audio";
import { DialogueProgress } from "./dialogue-progress";
import { DialogueControls } from "./dialogue-controls";
import type { DialogueLineDTO } from "@/modules/story/types/dialogue.dto";
import type { DialoguePhase } from "../hooks/use-dialogue-controller";

interface DialogueContentProps {
  line: DialogueLineDTO;
  displayedText: string;
  phase: DialoguePhase;
  lineIndex: number;
  totalLines: number;
  onAdvance: () => void;
}

export function DialogueContent({ line, displayedText, phase, lineIndex, totalLines, onAdvance }: DialogueContentProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <DialogueAudio audioUrl={line.audioUrl} lineKey={`${lineIndex}-${line.order}`} />
        <DialogueProgress lineIndex={lineIndex} totalLines={totalLines} />
      </div>
      <DialogueTypewriter text={displayedText} phase={phase} />
      <DialogueControls phase={phase} onAdvance={onAdvance} />
    </div>
  );
}