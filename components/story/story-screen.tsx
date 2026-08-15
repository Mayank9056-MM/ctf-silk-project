"use client";

import { StoryShell } from "./story-shell";
import { StoryStage } from "./stage/story-stage";
import { SceneVignette } from "./stage/scene-vignette";
import { SceneBackground } from "./scene/scene-background";
import { SceneAtmosphere } from "./scene/scene-atmosphere";
import { SceneLighting } from "./scene/scene-lighting";
import { CharacterLayer } from "./character/character-layer";
import { CinematicLetterbox } from "./cinematic/cinematic-letterbox";
import { SceneTransition } from "./transitions/scene-transition";
import { StoryLoading } from "./states/story-loading";
import { StoryError } from "./states/story-error";
import { StoryUnavailable } from "./states/story-unavailable";
import { StoryComplete } from "./completion/story-complete";
// import { StoryNavigation } from "./navigation/story-navigation";
import { SceneHeader } from "./scene/scene-header";
import { SceneContent } from "./scene/scene-content";
import { useStory } from "@/modules/story/hooks/use-story";
import { useSceneTransition } from "./hooks/use-scene-transition";
import { StoryNavigation } from "./story-navigation";
import { CinematicCamera } from "./cinematic/cinematic-camera";

/**
 * IMPORT PATH NOTE: your tree has scene-transition.tsx, evidence-reveal.tsx,
 * and challenge-transition.tsx consolidated under components/story/
 * transitions/ — not under stage/, evidence/, challenge/ respectively,
 * which is where I originally placed them. This file imports from the
 * real (transitions/) location. scene-content.tsx and challenge-gate.tsx
 * still import EvidenceReveal/ChallengeTransition from their OLD
 * locations — those two import lines need the same fix:
 *   scene-content.tsx:   "../evidence/evidence-reveal" → "../transitions/evidence-reveal"
 *   challenge-gate.tsx:  "./challenge-transition" → "../transitions/challenge-transition"
 */
export function StoryScreen() {
  const { data, isLoading, isError, error, refetch } = useStory();
  const transitionPhase = useSceneTransition(data?.scene?.id);

  if (isLoading) return <StoryLoading />;

  if (isError) {
    const message = error instanceof Error ? error.message : null;
    return message ? (
      <StoryUnavailable message={message} />
    ) : (
      <StoryError onRetry={() => refetch()} />
    );
  }

  if (!data) return <StoryError onRetry={() => refetch()} />;
  if (data.scene === null) return <StoryComplete />;

  const scene = data.scene;
  // Cosmetic-only choice, not derived from any DTO field: evidence-bearing
  // scenes lean warm (discovery/tension), everything else cold
  // (institutional/investigative). Never used to gate anything.
  const lightingTone = scene.evidence ? "warm" : "cold";

  return (
    <StoryShell>
      <StoryStage>
        <CinematicCamera triggerKey={scene.id}>
          <SceneBackground imageUrl={scene.backgroundUrl} />
        </CinematicCamera>
        <SceneAtmosphere />
        <CharacterLayer imageUrl={null} side="right" />
        <SceneLighting tone={lightingTone} />

        <div className="relative z-[10] flex h-full flex-col justify-between">
          <div className="sr-story-anim-nav">
            <StoryNavigation chapter={data.chapter} progress={data.progress} />
          </div>

          <SceneTransition transitionKey={scene.id}>
            <div className="mx-auto flex h-full w-full max-w-2xl flex-col justify-end px-8 pb-14">
              <div className="sr-story-anim-content flex flex-col gap-6">
                <SceneHeader chapter={data.chapter} scene={scene} />
                <SceneContent scene={scene} />
              </div>
            </div>
          </SceneTransition>
        </div>

        <CinematicLetterbox active={transitionPhase === "entering"} />
        <SceneVignette />
      </StoryStage>
    </StoryShell>
  );
}
