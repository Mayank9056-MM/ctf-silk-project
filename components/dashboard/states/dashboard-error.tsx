import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";

/** User-facing only — the real error is left to logging elsewhere; nothing here surfaces stack traces or raw messages. */
export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-lg border p-10 text-center", dashboardTheme.border.normal, dashboardTheme.background.elevated)}>
      <TriangleAlert className={cn("size-5", dashboardTheme.danger.crimson)} aria-hidden="true" />
      <p className={cn("text-[13px] font-medium", dashboardTheme.text.primary, dashboardTheme.font.ui)}>Unable to reach mission control</p>
      <p className={cn("max-w-[36ch] text-[12px]", dashboardTheme.text.muted, dashboardTheme.font.body)}>
        The dashboard couldn&apos;t load. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={cn("mt-1 rounded-md border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em]", dashboardTheme.border.normal, dashboardTheme.text.secondary)}
      >
        Retry
      </button>
    </div>
  );
}