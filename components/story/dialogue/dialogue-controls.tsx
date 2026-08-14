
import { cn } from "@/lib/utils";
import type { DialoguePhase } from "../hooks/use-dialogue-controller";
import { storyTheme } from "../story-theme";

interface DialogueControlsProps {
  phase: DialoguePhase;
  onAdvance: () => void;
}

/** A real, focusable, labeled button — not a div click handler — per accessibility requirements. The whole dialogue area is also click/keyboard-advanceable via use-story-keyboard.ts; this is the explicit, screen-reader-visible affordance. */
export function DialogueControls({ phase, onAdvance }: DialogueControlsProps) {
  if (phase === "sequence-complete") return null;
  return (
    <button
      type="button"
      onClick={onAdvance}
      className={cn(
        "self-end text-[10px] tracking-[0.14em] uppercase transition-colors hover:text-(--sr-crimson-hot)",
        storyTheme.text.muted,
        storyTheme.font.mono,
      )}
      aria-label={phase === "typing" ? "Skip to end of line" : "Continue"}
    >
      {phase === "typing" ? "Skip" : "Continue ▸"}
    </button>
  );
}