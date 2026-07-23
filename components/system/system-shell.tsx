import type { ReactNode } from "react";

import { ParticleField } from "@/components/auth/particle-field";
import { HudTop } from "@/components/auth/hud-top";

interface SystemShellProps {
  children: ReactNode;
  caseId?: string;
  /** Set false for transient states (loading) to skip the particle canvas. */
  showParticles?: boolean;
}

/**
 * Same vignette/grain/scanlines/HUD chrome as AuthShell, without the
 * centered-card framing, so 404/error screens can lay out their own
 * content. No motion/animation libraries here — this tier stays as cheap
 * as the auth screens, by design.
 */
export function SystemShell({ children, caseId, showParticles = true }: SystemShellProps) {
  return (
    <div className="sr-screen">
      {showParticles && <ParticleField />}
      <div className="sr-vignette" aria-hidden="true" />
      <div className="sr-grain" aria-hidden="true" />
      <div className="sr-scanlines" aria-hidden="true" />
      <HudTop caseId={caseId} />
      <div className="sr-content">{children}</div>
    </div>
  );
}