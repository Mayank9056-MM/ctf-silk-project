import { useQuery } from "@tanstack/react-query";

import { getEvidence } from "../actions/get-evidence";
import { storyKeys } from "../constants/story.keys";

/**
 * A single piece of evidence, player-facing. `enabled: Boolean(evidenceId)`
 * — same pattern as useChallenge(slug) and useUserRank(userId) elsewhere
 * in this codebase: this hook is meant for a detail view reached via
 * navigation (clicking an evidence card), so it must tolerate mounting
 * before a real evidenceId is available, not fire a request for
 * `undefined`.
 *
 * No refetchInterval — evidenceService.getEvidence's access check
 * (unlockService.evaluateEvidenceUnlock) only ever changes as a result
 * of the current player's own actions elsewhere in the story (advancing
 * scenes, solving challenges), never from another player's activity, so
 * there's nothing here that goes stale in the background the way
 * leaderboard data does.
 */
export function useEvidence(evidenceId: string | undefined) {
  return useQuery({
    queryKey: storyKeys.evidence(evidenceId ?? ""),
    queryFn: async () => {
      const result = await getEvidence(evidenceId!);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    enabled: Boolean(evidenceId),
  });
}