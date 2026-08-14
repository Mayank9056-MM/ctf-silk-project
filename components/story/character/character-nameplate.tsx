
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

export function CharacterNameplate({ displayName }: { displayName: string }) {
  return (
    <span className={cn("text-[11px] font-semibold tracking-[0.14em] uppercase", storyTheme.accent.crimson, storyTheme.font.mono)}>
      {displayName}
    </span>
  );
}