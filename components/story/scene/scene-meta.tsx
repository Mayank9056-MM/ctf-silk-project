
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

interface SceneMetaProps {
  chapterOrder: number;
  chapterTitle: string;
}

export function SceneMeta({ chapterOrder, chapterTitle }: SceneMetaProps) {
  return (
    <div className={cn("text-[10px] tracking-[0.14em] uppercase", storyTheme.text.muted, storyTheme.font.mono)}>
      Chapter {String(chapterOrder).padStart(2, "0")} — {chapterTitle}
    </div>
  );
}