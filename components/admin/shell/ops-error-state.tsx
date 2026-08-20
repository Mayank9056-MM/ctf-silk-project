import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OpsErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Every panel below (Audit, Players, Leaderboard, Announcements) was
 * rendering its own ad hoc `<p className="text-sm text-destructive">`
 * on failure — no retry affordance anywhere, unlike the story module's
 * StoryError, which always offers one. This is the missing consistency
 * fix: one error presentation, always with a way forward when the
 * caller has a refetch to offer.
 */
export function OpsErrorState({ message, onRetry }: OpsErrorStateProps) {
  return (
    <div className="ops-empty flex flex-col items-center gap-3 text-center">
      <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
      <p className="text-sm text-destructive">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}