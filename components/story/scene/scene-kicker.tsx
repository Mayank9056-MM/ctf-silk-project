
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

export function SceneKicker({ children }: { children: string }) {
  return (
    <span className={cn("text-[10px] tracking-[0.28em] uppercase", storyTheme.accent.crimson, storyTheme.font.mono)}>
      {children}
    </span>
  );
}