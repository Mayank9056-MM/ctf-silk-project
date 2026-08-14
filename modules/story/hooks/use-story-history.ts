import { useQuery } from "@tanstack/react-query";

import { getStoryHistory } from "../actions/get-story-history";
import { storyKeys } from "../constants/story.keys";

/**
 * A player's full completion history — unlike useStoryProgress, "no
 * history yet" is not an error state here (getStoryHistory returns an
 * empty `completions` array rather than throwing NOT_FOUND for a player
 * with no completions), so this hook's error branch only ever fires for
 * a genuine failure, never as a stand-in for "hasn't started."
 *
 * No refetchInterval — history only grows from the current player's own
 * scene completions (useAdvanceScene/useSelectChoice), same reasoning as
 * every other story hook. Neither of those two currently invalidates
 * storyKeys.history on success — same gap already flagged for
 * storyKeys.evidenceBoard in use-evidence-board.ts's doc comment, not
 * fixed here either since it means editing those two mutation hooks,
 * which wasn't asked for in this task.
 */
export function useStoryHistory() {
  return useQuery({
    queryKey: storyKeys.history,
    queryFn: async () => {
      const result = await getStoryHistory();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
  });
}