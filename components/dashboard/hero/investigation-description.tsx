import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";

interface InvestigationDescriptionProps {
  hasStarted: boolean;
}

/**
 * The suggested line from the spec, used verbatim as offered. "People
 * lie. Evidence doesn't." is Ethan's established signature quote
 * (docs/story/CHARACTERS.md explicitly sanctions it as a recurring UI
 * motif) — used here only as a quiet closing line, not as plot exposition.
 */
export function InvestigationDescription({ hasStarted }: InvestigationDescriptionProps) {
  return (
    <div className="mt-3 max-w-[38ch]">
      <p className={cn("text-[13px] italic", dashboardTheme.text.secondary, dashboardTheme.font.body)}>
        {hasStarted
          ? "Three weeks after his brother's death, Ethan Carter discovers that isolated overdose cases may be connected."
          : "A case file is waiting. Begin the investigation to receive your first briefing."}
      </p>
      <p className={cn("mt-2 text-[10px] tracking-[0.1em] uppercase", dashboardTheme.text.disabled, dashboardTheme.font.mono)}>
        People lie. Evidence doesn&apos;t.
      </p>
    </div>
  );
}