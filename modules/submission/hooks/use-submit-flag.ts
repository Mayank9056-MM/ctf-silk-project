// modules/submission/hooks/use-submit-flag.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { submitFlag } from "../actions/submit-flag";
import { submissionKeys } from "../constants/submission.keys";
import { challengeKeys } from "@/modules/challenge/constants/challenge.keys";
import { storyKeys } from "@/modules/story/constants/story.keys";
import type { ErrorCode } from "@/lib/errors/ErrorCode";

interface SubmitFlagVariables {
  challengeId: string;
  flag: string;
}

export class SubmitFlagError extends Error {
  readonly code?: ErrorCode;
  readonly errors?: Record<string, string[] | undefined>;

  constructor(message: string, code?: ErrorCode, errors?: Record<string, string[] | undefined>) {
    super(message);
    this.name = "SubmitFlagError";
    this.code = code;
    this.errors = errors;
  }
}

export function useSubmitFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, flag }: SubmitFlagVariables) => {
      const result = await submitFlag(challengeId, flag);

      if (!result.success || !result.data) {
        throw new SubmitFlagError(result.message, result.code, result.errors);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine });

      if (data.isCorrect) {
        queryClient.invalidateQueries({ queryKey: challengeKeys.all });
        // FIX: challengeKeys.all (["challenges"]) and
        // challengeKeys.detail(challengeId) (["challenge", challengeId])
        // are unrelated key roots — invalidating one never touches the
        // other (TanStack's default prefix matching only cascades to
        // keys that literally start with the invalidated key). Without
        // this, useChallenge(challengeId)'s cached, pre-solve
        // "authorized" response for THIS exact challenge kept being
        // served on revisit — full page renders fine, only the
        // (uncached) submit mutation correctly gets rejected. This is
        // the query that actually backs the challenge detail page; it
        // must be invalidated by its own real key.
        queryClient.invalidateQueries({ queryKey: challengeKeys.detail(variables.challengeId) });
        queryClient.invalidateQueries({ queryKey: storyKeys.currentScene });
        queryClient.invalidateQueries({ queryKey: storyKeys.progress });
      }
    },
  });
}