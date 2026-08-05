import { useMutation, useQueryClient } from "@tanstack/react-query";

import { unlockHint } from "../actions/unlock-hint";
import { hintKeys } from "../constants/hint.keys";

/**
 * ============================================================================
 * use-unlock-hint.ts
 * ============================================================================
 *
 * Thin mutation wrapper around unlockHint().
 *
 * Responsibilities
 *
 * - execute mutation
 * - invalidate cache
 *
 * Nothing else.
 *
 * Why no optimistic update?
 * ---------------------------------------------------------------------------
 * Unlocking a hint
 *
 * - deducts XP
 * - creates PlayerHint
 * - changes unlock eligibility
 *
 * These are transactional server-side operations.
 *
 * The authoritative state should always come from the server after the
 * transaction commits.
 */

export function useUnlockHint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlockHint,

    onSuccess: async () => {
      /**
       * Unlocking one hint can affect affordability in every challenge because
       * XP is global. Invalidate the entire Hint cache hierarchy.
       */
      await queryClient.invalidateQueries({
        queryKey: hintKeys.all,
      });
    },
  });
}
