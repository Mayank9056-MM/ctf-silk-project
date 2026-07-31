import { useMutation, useQueryClient } from "@tanstack/react-query";

import { advanceScene } from "../actions/advance-scene";
import { storyKeys } from "../constants/story.keys";

/**
 * Same "no optimistic update" stance as useSubmitFlag, for the same
 * reason: advanceScene's server-side check (does currentSceneId still
 * match this player's real position) exists specifically to catch stale
 * client state, so optimistically rendering the next scene before the
 * server confirms it would risk showing content the request then
 * rejects — worse than a brief pending state.
 *
 * Invalidates both chapterMap and progress on success — a scene advance
 * can complete a chapter (chapterMap's LOCKED/ACTIVE/COMPLETED states
 * shift) and always changes completedSceneCount (progress). currentScene
 * itself isn't invalidated: the mutation's own response already IS the
 * new current scene, so the caller should write that directly into the
 * currentScene query's cache rather than triggering a redundant refetch
 * for data it already has in hand.
 */
export function useAdvanceScene() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currentSceneId: string) => {
      const result = await advanceScene(currentSceneId);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(storyKeys.currentScene, data);
      queryClient.invalidateQueries({ queryKey: storyKeys.chapterMap });
      queryClient.invalidateQueries({ queryKey: storyKeys.progress });
    },
  });
}