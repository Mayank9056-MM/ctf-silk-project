import type { ReactNode } from "react";

/** Ambient background layers only now — the GSAP entrance scope moved to dashboard-content.tsx, which mounts exactly when there's real content to animate. This wrapper stays mounted for the whole loading→loaded lifecycle, which is precisely why it can no longer own a mount-once animation. */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-(--sr-bg-void)">
      <div className="pointer-events-none absolute inset-0">
        <div className="sr-dash-vignette" />
        <div className="sr-dash-grain" />
      </div>
      <div className="relative z-[1] mx-auto min-w-[1280px] max-w-[1440px] px-6 pb-14 pt-6">
        {children}
      </div>
    </div>
  );
}