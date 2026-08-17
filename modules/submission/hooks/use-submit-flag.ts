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

  constructor(
    message: string,
    code?: ErrorCode,
    errors?: Record<string, string[] | undefined>,
  ) {
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
        // refetchType: "none" — this challenge's detail query must be
        // marked stale (so a FUTURE mount — revisiting this URL after
        // navigating away, e.g. via back button — correctly refetches
        // and gets denied by ChallengeAccessService now that the story
        // has moved past this gate) without forcing an ACTIVE refetch
        // right now. The player is still looking at THIS exact
        // ChallengeScreen instance when this fires; a default active
        // refetch immediately re-runs getChallengeForPlayer, which
        // (correctly) now denies access to the just-solved gate,
        // flips useChallenge into isError, and ChallengeScreen tears
        // down the whole success view — including ChallengeResult —
        // in favor of ChallengeUnavailable, seconds after a correct
        // solve. The access denial itself is right; forcing it to
        // fire against the still-mounted success page is not.
        queryClient.invalidateQueries({
          queryKey: challengeKeys.detail(variables.challengeId),
          refetchType: "none",
        });
        queryClient.invalidateQueries({ queryKey: storyKeys.currentScene });
        queryClient.invalidateQueries({ queryKey: storyKeys.progress });
      }
    },
  });
}
