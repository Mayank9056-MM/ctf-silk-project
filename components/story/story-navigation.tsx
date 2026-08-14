import type { ChapterDTO } from "@/modules/story/types/chapter.dto";
import type { StoryProgressDTO } from "@/modules/story/types/progress.dto";
import { ChapterIndicator } from "./navigation/chapter-indicator";
import { ProgressIndicator } from "./navigation/progress-indicator";
import { ExitStory } from "./navigation/exit-story";

interface StoryNavigationProps {
  chapter: ChapterDTO;
  progress: StoryProgressDTO;
}

export function StoryNavigation({ chapter, progress }: StoryNavigationProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <ChapterIndicator order={chapter.order} title={chapter.title} />
      <div className="flex items-center gap-4">
        <ProgressIndicator completedSceneCount={progress.completedSceneCount} />
        <ExitStory />
      </div>
    </div>
  );
}
