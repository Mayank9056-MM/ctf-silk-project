import { useQuery } from "@tanstack/react-query";

import { getChapterMap } from "../actions/get-chapter-map";
import { storyKeys } from "../constants/story.keys";

/**
 * The campaign map — not gated on event-live (storyService.getChapterMap
 * itself deliberately serves this before/after the event, per its own
 * doc comment), so this hook doesn't need any `enabled` guard tied to
 * event state either.
 *
 * No refetchInterval — unlike useLeaderboard/useMyRank, which poll
 * because standings change from OTHER players' actions the current
 * viewer isn't otherwise notified of. The chapter map only changes from
 * the current player's own scene transitions (advanceScene/selectChoice),
 * and both of those already invalidate storyKeys.chapterMap directly on
 * success — polling here would just be redundant background traffic for
 * data that only ever goes stale from an action this same client already
 * knows about.
 */
export function useChapterMap() {
  return useQuery({
    queryKey: storyKeys.chapterMap,
    queryFn: async () => {
      const result = await getChapterMap();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
  });
}