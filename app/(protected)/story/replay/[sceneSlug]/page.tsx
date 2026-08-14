// app/(protected)/story/replay/[sceneSlug]/page.tsx
"use client";

import { use } from "react";
import { cn } from "@/lib/utils";
import { useReplayScene } from "@/modules/story/hooks/use-replay-scene";
import { StoryLoading } from "@/components/story/states/story-loading";
import { StoryError } from "@/components/story/states/story-error";
import { StoryStage } from "@/components/story/stage/story-stage";
import { SceneVignette } from "@/components/story/stage/scene-vignette";
import { DialogueSystem } from "@/components/story/dialogue/dialogue-system";
import { storyTheme } from "@/components/story/story-theme";

/**
 * ⚠️ UNRESOLVED CONTRACT GAP — do not ship this as-is without deciding
 * one of the two fixes below.
 *
 * replayScene(sceneId) needs a real scene id (its schema field is
 * literally named sceneId, and the service ends up calling
 * hasCompletedScene(userId, sceneId), which queries by id). But:
 *   - This route's only param is a slug ([sceneSlug]).
 *   - StoryHistoryDTO — the one place a player's completed-scene list is
 *     exposed — only returns `sceneSlug`, never an id. There is
 *     currently NO existing action that lets the client resolve a scene
 *     slug into its id.
 *
 * Unlike the evidence detail page, there's no board/list response
 * anywhere in this module that carries both slug AND id for scenes, so
 * the trick used there doesn't apply here. This file passes the slug
 * straight through to replayScene() as a placeholder — it will 404 via
 * the backend's own "identical response for wrong id or uncompleted
 * scene" behavior on every real request, not just some.
 *
 * Pick one:
 *   1. Add `sceneId` to SceneCompletionDTO (small, additive, matches how
 *      EvidenceBoardItemDTO already exposes both id and slug together).
 *   2. Change replay-scene.schema.ts / replayScene's contract to accept
 *      a slug and resolve it to an id server-side (keeps the id fully
 *      internal, arguably the better boundary).
 * Either is a real backend change — I'm flagging it rather than routing
 * around it with an invented client-side lookup.
 */
export default function ReplayScenePage({ params }: { params: Promise<{ sceneSlug: string }> }) {
  const { sceneSlug } = use(params);
  const replay = useReplayScene(sceneSlug);

  if (replay.isLoading) return <StoryLoading />;
  if (replay.isError || !replay.data) return <StoryError onRetry={() => replay.refetch()} />;

  const scene = replay.data;

  return (
    <StoryStage>
      <div className="relative z-[10] flex h-full flex-col justify-between">
        <div className="px-6 py-3">
          <span className={cn("text-[10px] tracking-[0.14em] uppercase", storyTheme.accent.crimson, storyTheme.font.mono)}>
            Replay
          </span>
        </div>
        <div className="mx-auto w-full max-w-2xl px-8 pb-14">
          {/* Replay never mutates progression — DialogueSystem's onSequenceComplete is a no-op here on purpose, unlike the live story path where it drives beat transitions toward choices/evidence/challenges. */}
          <DialogueSystem lines={scene.dialogueLines} onSequenceComplete={() => {}} />
        </div>
      </div>
      <SceneVignette />
    </StoryStage>
  );
}