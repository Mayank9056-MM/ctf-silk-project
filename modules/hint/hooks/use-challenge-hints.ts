import { useQuery } from "@tanstack/react-query";

import { getChallengeHints } from "../actions/get-challenge-hints";
import { hintKeys } from "../constants/hint.keys";
import type { HintListDTO } from "../types/hint.dto";

export function useChallengeHints(challengeId: string) {
  return useQuery<HintListDTO>({
    queryKey: hintKeys.challenge(challengeId),
    queryFn: () => getChallengeHints({ challengeId }),
    enabled: Boolean(challengeId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
