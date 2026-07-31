import { useQuery } from "@tanstack/react-query";

import { getStoryProgress } from "../actions/get-story-progress";
import { storyKeys } from "../constants/story.keys";

/**
 * Unlike useChapterMap/useCurrentScene, getStoryProgress genuinely CAN
 * fail with a real "not found" for a player who hasn't started yet —
 * storyService.getStoryProgress throws NOT_FOUND rather than
 * bootstrapping a row (see that service method's own doc comment). That
 * NOT_FOUND surfaces here as a thrown Error, same as any other failure,
 * so the consuming component must distinguish "genuinely broken" from
 * "just hasn't started" itself — e.g. by checking the error message, or
 * by preferring useCurrentScene (which always bootstraps and returns
 * data) for any UI whose job is getting a new player playing, and
 * reserving this hook for a HUD/summary view where "not started yet" is
 * a real, displayable state rather than something to paper over.
 *
 * No refetchInterval, same reasoning as the other two story hooks: this
 * only changes from the player's own actions, and useAdvanceScene/
 * useSelectChoice both already invalidate storyKeys.progress on success.
 */
export function useStoryProgress() {
  return useQuery({
    queryKey: storyKeys.progress,
    queryFn: async () => {
      const result = await getStoryProgress();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
  });
}