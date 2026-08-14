
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

export function SceneTitle({ title }: { title: string | null }) {
  if (!title) return null;
  return (
    <h2 className={cn("text-2xl font-bold leading-tight", storyTheme.text.primary, storyTheme.font.display)}>{title}</h2>
  );
}