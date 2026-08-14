
import { cn } from "@/lib/utils";
import type { ChoiceDTO } from "@/modules/story/types/scene.dto";
import { storyTheme } from "../story-theme";

interface ChoiceItemProps {
  choice: ChoiceDTO;
  onSelect: (choiceId: string) => void;
  disabled: boolean;
}

export function ChoiceItem({ choice, onSelect, disabled }: ChoiceItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(choice.id)}
      disabled={disabled}
      className={cn(
        "group flex w-full items-baseline gap-3 rounded-sm border px-4 py-3 text-left transition-all",
        "hover:translate-x-1 hover:border-(--sr-crimson-hot)",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--sr-crimson-hot)",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0",
        storyTheme.border.normal,
      )}
    >
      <span className={cn("text-[11px] tabular-nums", storyTheme.text.muted, storyTheme.font.mono)}>
        {String(choice.order).padStart(2, "0")}
      </span>
      <span className={cn("text-[13.5px]", storyTheme.text.primary, storyTheme.font.body)}>{choice.label}</span>
    </button>
  );
}