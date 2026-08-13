import { DashboardPanel, DashboardPanelTitle } from "../dashboard-panel";
import { ObjectiveAction } from "./objective-action";
import type { DashboardNextObjectiveDTO } from "@/modules/dashboard/types/dashboard.dto";

/** Renders nothing if null — per spec section 16, no fake objective is ever fabricated. */
export function NextObjective({ objective }: { objective: DashboardNextObjectiveDTO | null }) {
  if (!objective) return null;

  return (
    <DashboardPanel className="sr-dash-anim-secondary">
      <DashboardPanelTitle>Next Objective</DashboardPanelTitle>
      <p className="text-[13px] text-(--sr-text-primary) sr-font-body">{objective.label}</p>
      <ObjectiveAction objective={objective} />
    </DashboardPanel>
  );
}