import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { srButtonOutline } from "../dashboard-button";
import { OBJECTIVE_DESTINATION_HREF } from "./objective-destination";
import type { DashboardNextObjectiveDTO } from "@/modules/dashboard/types/dashboard.dto";

export function ObjectiveAction({ objective }: { objective: DashboardNextObjectiveDTO }) {
  const href = OBJECTIVE_DESTINATION_HREF[objective.destination](objective.chapterSlug);
  return (
    <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), srButtonOutline, "mt-3 w-fit")}>
      {objective.label}
    </Link>
  );
}