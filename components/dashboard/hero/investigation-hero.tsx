"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { dashboardTheme } from "../dashboard-theme";
import { InvestigationBackdrop } from "./investigation-backdrop";
import { InvestigationCharacter } from "./investigation-character";
import { InvestigationKicker } from "./investigation-kicker";
import { InvestigationTitle } from "./investigation-title";
import { InvestigationDescription } from "./investigation-description";
import { InvestigationProgress } from "./investigation-progress";
import { InvestigationAction } from "./investigation-action";
import type { DashboardEventDTO, DashboardInvestigationDTO } from "@/modules/dashboard/types/dashboard.dto";
import { prettifySlug } from "../dashboard-format";

interface InvestigationHeroProps {
  investigation: DashboardInvestigationDTO;
  event: DashboardEventDTO;
}

export function InvestigationHero({ investigation, event }: InvestigationHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chapterNumber =
    investigation.completedChapters + 1 <= investigation.totalChapters
      ? String(investigation.completedChapters + 1).padStart(2, "0")
      : null;
  const sceneLabel = prettifySlug(investigation.currentSceneSlug);

  return (
    <div
      ref={containerRef}
      className={cn("sr-hero sr-dash-anim-hero relative mt-4 min-h-[300px] overflow-hidden rounded-lg border p-8", dashboardTheme.border.normal)}
    >
      <InvestigationBackdrop />
      <InvestigationCharacter containerRef={containerRef} />

      <div className="relative z-[1] max-w-[56%]">
        <InvestigationKicker>{chapterNumber ? `Chapter ${chapterNumber}` : "Case File"}</InvestigationKicker>
        <InvestigationTitle chapterSlug={investigation.currentChapterSlug} />
        {sceneLabel && (
          <p className={cn("mt-1 text-[11px] tracking-[0.08em]", dashboardTheme.text.muted, dashboardTheme.font.mono)}>
            Current Scene — {sceneLabel}
          </p>
        )}
        <InvestigationDescription hasStarted={investigation.hasStarted} />
        <InvestigationProgress
          progressPercent={investigation.progressPercent}
          completedChapters={investigation.completedChapters}
          totalChapters={investigation.totalChapters}
        />
        <InvestigationAction investigation={investigation} event={event} />
      </div>
    </div>
  );
}