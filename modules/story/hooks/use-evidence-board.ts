import { useQuery } from "@tanstack/react-query";

import { getEvidenceBoard } from "../actions/get-evidence-board";
import { storyKeys } from "../constants/story.keys";

/**
 * UNVERIFIED ASSUMPTION: modules/story/actions/get-evidence-board.ts was
 * not shown to me — this hook is written against the same pattern every
 * other action in this module follows exactly (requireAuth() only, no
 * schema, `ActionState<EvidenceBoardDTO>` return, an exported function
 * named `getEvidenceBoard` taking no arguments, mirroring
 * evidenceService.getEvidenceBoard(userId) where userId comes from the
 * session). If the real file differs in export name, argument shape, or
 * return shape, this hook needs a matching update — confirm against the
 * actual file before relying on this.
 *
 * No refetchInterval, same reasoning as useChapterMap/useCurrentScene:
 * the board only changes from the current player's own actions
 * (evidence gets DISCOVERED as a side effect of scene transitions), and
 * useAdvanceScene/useSelectChoice already invalidate storyKeys.chapterMap
 * and storyKeys.progress on success. Neither currently invalidates
 * storyKeys.evidenceBoard — that's a real gap worth closing (a scene
 * transition that reveals new evidence won't refresh an already-mounted
 * evidence board without a manual refetch or remount), but fixing it
 * means editing use-advance-scene.ts/use-select-choice.ts, which wasn't
 * asked for here — flagging rather than silently patching those two
 * files as a side effect of this task.
 */
export function useEvidenceBoard() {
  return useQuery({
    queryKey: storyKeys.evidenceBoard,
    queryFn: async () => {
      const result = await getEvidenceBoard();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
  });
}