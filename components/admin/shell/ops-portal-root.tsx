"use client";

import * as React from "react";
import { PortalContainerProvider } from "@/providers/portal-container-context";

/**
 * The only client boundary this fix needs. AdminShell stays a plain
 * Server Component (per its own doc comment on why) — this wraps just
 * the portal-container plumbing.
 *
 * A ref alone isn't enough to hand a real DOM node to context: on
 * first render, refs are null until after the DOM commits. Mirroring
 * the ref into state via useEffect (mount-only) is what lets consumers
 * far down the tree (Select/Dialog/AlertDialog) actually receive the
 * element instead of null on their first render too.
 */
export function OpsPortalRoot({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    setContainer(containerRef.current);
  }, []);

  return (
    <div ref={containerRef} className="ops-root">
      <PortalContainerProvider container={container}>
        {children}
      </PortalContainerProvider>
    </div>
  );
}