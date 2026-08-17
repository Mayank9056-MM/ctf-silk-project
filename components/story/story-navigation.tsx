// components/story/story-navigation.tsx
import type { ChapterDTO } from "@/modules/story/types/chapter.dto";
import type { StoryProgressDTO } from "@/modules/story/types/progress.dto";
import { ChapterIndicator } from "./navigation/chapter-indicator";
import { ProgressIndicator } from "./navigation/progress-indicator";
import { ExitStory } from "./navigation/exit-story";

interface StoryNavigationProps {
  chapter: ChapterDTO;
  progress: StoryProgressDTO;
}

/**
 * `relative z-30 pointer-events-auto` added defensively — the parent
 * `.sr-story-anim-nav` wrapper (in story-screen.tsx) is a GSAP entrance
 * target, and unlike the "safety net" classes in globals.css
 * (.sr-anim-*, .sr-dash-anim-*, .sr-stage-anim), .sr-story-anim-nav has
 * no CSS fallback rule forcing opacity/pointer-events back to normal if
 * the GSAP timeline never resolves for it. This makes the interactive
 * children clickable unconditionally, regardless of that timeline's
 * state — doesn't fix a broken GSAP target itself (that's a separate,
 * unseen-file problem if it exists), but guarantees this row is never
 * the reason a click doesn't land.
 */
export function StoryNavigation({ chapter, progress }: StoryNavigationProps) {
  return (
    <div className="relative z-30 flex items-center justify-between px-6 py-3 pointer-events-auto">
      <ChapterIndicator order={chapter.order} title={chapter.title} />
      <div className="flex items-center gap-4">
        <ProgressIndicator completedSceneCount={progress.completedSceneCount} />
        <ExitStory />
      </div>
    </div>
  );
}