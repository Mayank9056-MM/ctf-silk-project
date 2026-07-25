import { useQuery } from "@tanstack/react-query";

import { getChallenge } from "../actions/get-challenge";
import { challengeKeys } from "../constants/challenge.keys";

export function useChallenge(slug: string) {
  return useQuery({
    queryKey: challengeKeys.detail(slug),
    queryFn: async () => {
      const result = await getChallenge(slug);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    enabled: Boolean(slug),
  });
}
