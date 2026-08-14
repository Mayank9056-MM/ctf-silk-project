import type { ReactNode } from "react";
import { SceneVignette } from "./scene-vignette";
import { SceneGrain } from "./scene-grain";

interface StoryStageProps {
  children: ReactNode;
}

/** The full-viewport cinematic canvas everything else composes into. Ambient layers only — no business logic, no data fetching. No forced min-width: mobile composition (per spec) needs this to actually shrink, not horizontally scroll a desktop-sized canvas. */
export function StoryStage({ children }: StoryStageProps) {
  return (
    <div className="sr-stage-anim relative h-dvh w-full overflow-hidden bg-(--sr-bg-void)">
      {children}
      <SceneVignette />
      <SceneGrain />
    </div>
  );
}