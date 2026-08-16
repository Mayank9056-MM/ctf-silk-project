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

/** Now also carries `errors` (ActionState's fieldErrors) — VALIDATION_ERROR
 * failures need the actual Zod message ("Invalid flag format...") not
 * just the generic ActionState.message ("Please check your submission."). */
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine });

      if (data.isCorrect) {
        queryClient.invalidateQueries({ queryKey: challengeKeys.all });
        queryClient.invalidateQueries({ queryKey: storyKeys.currentScene });
        queryClient.invalidateQueries({ queryKey: storyKeys.progress });
      }
    },
  });
}