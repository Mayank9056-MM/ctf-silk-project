import { useQuery } from "@tanstack/react-query";

import { getCurrentScene } from "../actions/get-current-scene";
import { storyKeys } from "../constants/story.keys";

/**
 * The player's live position — bootstraps a fresh StoryProgress row on
 * first call (see storyNavigationService.getOrCreateProgress), so unlike
 * useChapterMap this always has data to return for any signed-in player,
 * never a genuine "not found" state the way useStoryProgress can.
 *
 * No refetchInterval, same reasoning as useChapterMap: this only changes
 * from the current player's own actions (useAdvanceScene/useSelectChoice),
 * both of which already write the fresh result directly into this exact
 * query key via setQueryData on success — polling would be redundant
 * background traffic for data this client already updates itself the
 * moment it changes.
 */
export function useCurrentScene() {
  return useQuery({
    queryKey: storyKeys.currentScene,
    queryFn: async () => {
      const result = await getCurrentScene();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
  });
}