import { SceneMeta } from "./scene-meta";
import { SceneKicker } from "./scene-kicker";
import { SceneTitle } from "./scene-title";
import type { ChapterDTO } from "@/modules/story/types/chapter.dto";
import type { SceneDTO } from "@/modules/story/types/scene.dto";

interface SceneHeaderProps {
  chapter: ChapterDTO;
  scene: SceneDTO;
}

export function SceneHeader({ chapter, scene }: SceneHeaderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <SceneMeta chapterOrder={chapter.order} chapterTitle={chapter.title} />
      {scene.title && <SceneTitle title={scene.title} />}
    </div>
  );
}