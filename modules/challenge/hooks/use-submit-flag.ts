import { useMutation } from "@tanstack/react-query";

import { submitFlag } from "../actions/submit-flag";
import { submitFlagInput } from "../validations/submit-flag.schema";

export function useSubmitFlag() {
  return useMutation({
    mutationFn: async ({ challengeId, flag }: submitFlagInput) => {
      const result = await submitFlag(challengeId, flag);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
  });
}
