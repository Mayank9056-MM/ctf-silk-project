import type { DashboardObjectiveDestination } from "@/modules/dashboard/types/dashboard.types";

/** Only ever "STORY" today (per dashboard.types.ts's own comment) — this map exists so a future second destination is a one-line addition, not a rewrite. */
export const OBJECTIVE_DESTINATION_HREF: Record<DashboardObjectiveDestination, (chapterSlug: string) => string> = {
  STORY: (chapterSlug) => (chapterSlug ? `/story/${chapterSlug}` : "/story"),
};