import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { prettifySlug } from "../dashboard-format";

export function InvestigationTitle({ chapterSlug }: { chapterSlug: string | null }) {
  const label = prettifySlug(chapterSlug) ?? "No Active Chapter";
  return (
    <h1 className={cn("mt-2 text-[34px] font-bold leading-[0.95] tracking-tight", dashboardTheme.text.primary, dashboardTheme.font.display)}>
      {label}
    </h1>
  );
}