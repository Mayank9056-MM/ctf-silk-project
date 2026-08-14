import { useQuery } from "@tanstack/react-query";

import { replayScene } from "../actions/replay-scene";
import { storyKeys } from "../constants/story.keys";

/**
 * A completed scene's full content, re-rendered. Modeled as a query, not
 * a mutation — despite replay-scene.ts's action living in actions/
 * alongside advance-scene/select-choice, its own doc comment is explicit
 * that this is a read with no fairness/scoring consequence ("replaying
 * content a player has legitimately already completed carries no
 * fairness/scoring consequence"), unlike those two, which mutate
 * StoryProgress. storyKeys.replayScene(sceneId) was already shaped as a
 * parameterized query key for exactly this reason — not a coincidence
 * this hook fits it directly.
 *
 * `enabled: Boolean(sceneId)`, same reasoning as useEvidence — reached
 * via navigation (a "replay" link in story history), so it must tolerate
 * mounting before a real sceneId exists.
 *
 * No refetchInterval — completed scene content is immutable from the
 * player's perspective once completed; nothing about a past scene goes
 * stale in the background.
 */
export function useReplayScene(sceneId: string | undefined) {
  return useQuery({
    queryKey: storyKeys.replayScene(sceneId ?? ""),
    queryFn: async () => {
      const result = await replayScene(sceneId!);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    enabled: Boolean(sceneId),
  });
}