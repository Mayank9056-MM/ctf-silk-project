import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  DashboardEventDTO,
  DashboardInvestigationDTO,
} from "@/modules/dashboard/types/dashboard.dto";

interface InvestigationActionProps {
  investigation: DashboardInvestigationDTO;
  event: DashboardEventDTO;
}

/**
 * `/story` route is ASSUMED, not confirmed — the inspected route tree
 * only shows app/(protected)/dashboard and .../leaderboard. Update the
 * href once the real story route exists. nextAction already folds in
 * canAccessGame (see dashboard.mapper.ts's toNextAction), so this only
 * needs to distinguish ENDED (→ standings) from SOON/PAUSED (→ disabled).
 */
export function InvestigationAction({
  investigation,
  event,
}: InvestigationActionProps) {
  const cta = cn(
    buttonVariants({ size: "lg" }),
    "sr-cta-glow mt-6 w-fit bg-(--sr-crimson) text-white hover:bg-(--sr-crimson-hot)",
  );

  if (investigation.nextAction === "BEGIN_INVESTIGATION") {
    return (
      <Link href="/story" className={cta}>
        Begin Investigation
      </Link>
    );
  }

  if (investigation.nextAction === "RESUME_INVESTIGATION") {
    const href = investigation.currentChapterSlug
      ? `/story/chapters/${investigation.currentChapterSlug}`
      : "/story";
    return (
      <Link href={href} className={cta}>
        Resume Investigation
      </Link>
    );
  }

  if (event.state === "ENDED") {
    return (
      <Link href="/leaderboard" className={cta}>
        View Final Standings
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(cta, "cursor-not-allowed opacity-50")}
      disabled
    >
      {event.state === "SOON" ? "Awaiting Deployment" : "Operations Suspended"}
    </button>
  );
}
