
import { cn } from "@/lib/utils";
import type { DialoguePhase } from "../hooks/use-dialogue-controller";
import { storyTheme } from "../story-theme";

interface DialogueTypewriterProps {
  text: string;
  phase: DialoguePhase;
}

export function DialogueTypewriter({ text, phase }: DialogueTypewriterProps) {
  return (
    <p className={cn("text-[15px] leading-relaxed", storyTheme.text.primary, storyTheme.font.body)} aria-live="polite">
      {text}
      {phase === "typing" && <span className="sr-dialogue-cursor" aria-hidden="true">▍</span>}
    </p>
  );
}