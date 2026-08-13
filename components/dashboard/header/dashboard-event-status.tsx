import { StatusIndicator } from "../status/status-indicator";
import type { DashboardEventState } from "@/modules/dashboard/types/dashboard.types";

const HEADER_LABEL: Record<DashboardEventState, string> = {
  SOON: "Soon",
  LIVE: "Live",
  PAUSED: "Paused",
  ENDED: "Ended",
};

/** Compact header badge — the full state treatment lives in status/dashboard-status-strip.tsx. */
export function DashboardEventStatus({ state }: { state: DashboardEventState }) {
  return <StatusIndicator state={state} label={HEADER_LABEL[state]} />;
}