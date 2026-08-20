"use client";

import { Button } from "@/components/ui/button";
import { useFreezeLeaderboard } from "@/modules/leaderboard/hooks/use-freeze-leaderboard";
import { useUnfreezeLeaderboard } from "@/modules/leaderboard/hooks/use-unfreeze-leaderboard";

interface FreezeToggleProps {
  frozenAt: Date | string | null;
}

/**
 * freezeLeaderboard()/unfreezeLeaderboard() return ActionState<void>
 * rather than throwing — see useFreezeLeaderboard's own doc comment.
 * That means both the mutation-level error AND a `success: false`
 * result need to be surfaced here; `displayError` merges the two into
 * one string so the rest of this component doesn't have to branch
 * twice.
 */
export function FreezeToggle({ frozenAt }: FreezeToggleProps) {
  const freeze = useFreezeLeaderboard();
  const unfreeze = useUnfreezeLeaderboard();

  const isFrozen = Boolean(frozenAt);
  const pending = freeze.isPending || unfreeze.isPending;

  const displayError =
    freeze.error?.message ??
    (freeze.data && !freeze.data.success ? freeze.data.message : null) ??
    unfreeze.error?.message ??
    (unfreeze.data && !unfreeze.data.success ? unfreeze.data.message : null);

  return (
    <div className="flex items-center gap-3">
      {isFrozen ? (
        <span className="ops-badge" data-tone="warn">
          Frozen since {new Date(frozenAt as string).toLocaleString()}
        </span>
      ) : (
        <span className="ops-badge" data-tone="live">
          Live standings
        </span>
      )}

      {isFrozen ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => unfreeze.mutate()}>
          {unfreeze.isPending ? "Unfreezing…" : "Unfreeze"}
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => freeze.mutate()}>
          {freeze.isPending ? "Freezing…" : "Freeze standings"}
        </Button>
      )}

    {displayError ? (
  <span className="text-sm text-destructive" role="alert">
    {displayError}
  </span>
) : null}
    </div>
  );
}
