import { useQuery } from "@tanstack/react-query";

import { getChallenges } from "../actions/get-challenges";
import { challengeKeys } from "../constants/challenge.keys";

export function useChalleneges() {
  return useQuery({
    queryKey: challengeKeys.all,
    queryFn: async () => {
      const result = await getChallenges();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
  });
}
