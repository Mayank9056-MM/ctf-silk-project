// modules/challenge/hooks/use-challenge.ts
import { useQuery } from "@tanstack/react-query";

import { getChallenge } from "../actions/get-challenge";
import { challengeKeys } from "../constants/challenge.keys";

export function useChallenge(challengeId: string) {
  return useQuery({
    queryKey: challengeKeys.detail(challengeId),
    queryFn: async () => {
      const result = await getChallenge(challengeId);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    enabled: Boolean(challengeId),
  });
}