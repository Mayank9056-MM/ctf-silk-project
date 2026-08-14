"use client";

import { StoryShell } from "./story-shell";
import { StoryStage } from "./stage/story-stage";
import { StoryLoading } from "./states/story-loading";
import { StoryError } from "./states/story-error";
import { StoryUnavailable } from "./states/story-unavailable";
import { StoryComplete } from "./completion/story-complete";

import { SceneHeader } from "./scene/scene-header";
import { SceneContent } from "./scene/scene-content";
import { SceneVignette } from "./stage/scene-vignette";
import { useStory } from "@/modules/story/hooks/use-story";
import { StoryNavigation } from "./story-navigation";

export function StoryScreen() {
  const { data, isLoading, isError, error, refetch } = useStory();

  if (isLoading) return <StoryLoading />;

  if (isError) {
    const message = error instanceof Error ? error.message : null;
    return message ? <StoryUnavailable message={message} /> : <StoryError onRetry={() => refetch()} />;
  }

  if (!data) return <StoryError onRetry={() => refetch()} />;

  if (data.scene === null) return <StoryComplete />;

  return (
    <StoryShell>
      <StoryStage>
        <div className="relative z-[10] flex h-full flex-col justify-between">
          <div className="sr-story-anim-nav">
            <StoryNavigation chapter={data.chapter} progress={data.progress} />
          </div>
          <div className="sr-story-anim-content mx-auto w-full max-w-2xl px-8 pb-14">
            <SceneHeader chapter={data.chapter} scene={data.scene} />
            <div className="mt-6">
              {/* key={scene.id}: forces a fresh SceneContent instance per scene, so
                  its local `beat` state can't survive across a scene transition
                  (see PR review — without this, advanceScene/selectChoice could
                  land on a fresh scene with `beat` still stuck on "resolution"). */}
              <SceneContent key={data.scene.id} scene={data.scene} />
            </div>
          </div>
        </div>
        <SceneVignette />
      </StoryStage>
    </StoryShell>
  );
}