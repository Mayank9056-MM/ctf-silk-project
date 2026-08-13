import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "@/lib/constants/brand";

export function DashboardBrand() {
  return (
    <div className="flex flex-col leading-none">
      <span className={cn("text-[15px] font-bold tracking-[0.02em]", dashboardTheme.text.primary, dashboardTheme.font.display)}>
        {PLATFORM_NAME}
      </span>
      <span
        className={cn(
          "sr-text-crisp mt-0.5 text-[9px] tracking-[0.18em] uppercase",
          dashboardTheme.text.secondary,
          dashboardTheme.font.mono,
        )}
      >
        {PLATFORM_TAGLINE}
      </span>
    </div>
  );
}