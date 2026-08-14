import { DialogueSpeaker } from "./dialogue-speaker";
import { DialogueContent } from "./dialogue-content";
import type { DialogueLineDTO } from "@/modules/story/types/dialogue.dto";
import type { DialoguePhase } from "../hooks/use-dialogue-controller";

interface DialogueLineProps {
  line: DialogueLineDTO;
  displayedText: string;
  phase: DialoguePhase;
  lineIndex: number;
  totalLines: number;
  onAdvance: () => void;
}

export function DialogueLine(props: DialogueLineProps) {
  return (
    <div className="flex flex-col gap-3">
      <DialogueSpeaker speaker={props.line.speaker} />
      <DialogueContent {...props} />
    </div>
  );
}