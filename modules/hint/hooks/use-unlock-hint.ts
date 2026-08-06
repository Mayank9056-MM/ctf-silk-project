import { useMutation, useQueryClient } from "@tanstack/react-query";

import { unlockHint } from "../actions/unlock-hint";
import { hintKeys } from "../constants/hint.keys";
import type { HintUnlockDTO } from "../types/hint.dto";

/**
 * Backs the "unlock this hint" action. unlockHint() (the Server Action)
 * already owns every business decision — order, affordability, the
 * transaction, the P2002 race-safety net. This hook's only jobs are
 * running the mutation and invalidating whatever cached data its
 * success makes stale.
 *
 * Invalidates hintKeys.all, not just hintKeys.challenge(challengeId) —
 * deliberately. canUnlock depends on the player's GLOBAL XP balance, so
 * spending XP on a hint in one challenge can make a hint in a different
 * challenge newly unaffordable; a narrower invalidation would leave
 * other challenges' cached hint lists silently wrong. HintUnlockDTO also
 * carries no challengeId to invalidate narrowly with even if that were
 * desirable — see hint.dto.ts.
 *
 * No optimistic update. The actual outcome of an unlock attempt isn't
 * safely predictable client-side — hint.service.ts has a real,
 * expected race path (the P2002-derived ALREADY_UNLOCKED) specifically
 * because a client-side pre-check can pass while the authoritative
 * database check still fails. Optimistically marking a hint unlocked
 * and then rolling it back on failure would be a worse experience than
 * a brief loading state, for what is a deliberate, infrequent click —
 * not a high-frequency interaction where perceived latency justifies
 * that complexity and rollback risk.
 *
 * No onError — errors are not caught here; they surface through this
 * mutation's own `error`/`isError` state for the calling component to
 * handle.
 */
export function useUnlockHint() {
  const queryClient = useQueryClient();

  return useMutation<HintUnlockDTO, unknown, string>({
    mutationFn: (hintId) => unlockHint({ hintId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hintKeys.all });
    },
  });
}
