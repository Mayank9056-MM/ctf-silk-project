import type { ReactNode } from "react";

import { ParticleField } from "@/components/auth/particle-field";
import { HudTop } from "@/components/auth/hud-top";

interface AuthShellProps {
  children: ReactNode;
  eyebrow: string;
  caseId?: string;
}

/**
 * Shared chrome for the auth screens — same vignette/grain/scanlines/HUD
 * language as the story mode's title screen, scoped to a single centered
 * terminal card instead of the full cinematic screen stack.
 */
export function AuthShell({ children, eyebrow, caseId }: AuthShellProps) {
  return (
    <div className="sr-screen">
      <ParticleField />
      <div className="sr-vignette" aria-hidden="true" />
      <div className="sr-grain" aria-hidden="true" />
      <div className="sr-scanlines" aria-hidden="true" />
      <HudTop caseId={caseId} />
      <div className="sr-content">
        <div className="sr-card">
          <span className="sr-eyebrow sr-eyebrow-accent">{eyebrow}</span>
          {children}
        </div>
      </div>
    </div>
  );
}