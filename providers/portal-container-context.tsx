"use client";

import * as React from "react";

/**
 * Lets a subtree (specifically: AdminShell) tell every Select/Dialog/
 * AlertDialog rendered inside it which DOM node to portal its popup
 * into, instead of Base UI's default of document.body.
 *
 * WHY THIS EXISTS: .ops-root's dark-mode CSS variable overrides
 * (--background, --primary, --input, etc.) only cascade to descendants
 * of .ops-root in the actual DOM. Base UI's Portal mounts into
 * document.body by default, which is a SIBLING of .ops-root, not a
 * descendant — so portaled popups were resolving the light-mode
 * :root values instead. Giving Portal an explicit container inside
 * .ops-root fixes that.
 *
 * Default is null, meaning "no override" — every player-facing sr-*
 * screen and any other consumer of Select/Dialog/AlertDialog outside
 * /admin keeps Base UI's normal document.body portaling, completely
 * unaffected by this change.
 */
const PortalContainerContext = React.createContext<HTMLElement | null>(null);

export function PortalContainerProvider({
  container,
  children,
}: {
  container: HTMLElement | null;
  children: React.ReactNode;
}) {
  return (
    <PortalContainerContext.Provider value={container}>
      {children}
    </PortalContainerContext.Provider>
  );
}

/**
 * Returns the ambient portal container, or undefined when none was
 * provided. Returning `undefined` (not `null`) matters here — Base
 * UI's Portal treats an explicit `null` container as "don't portal at
 * all" on some primitives, whereas `undefined` cleanly falls through
 * to its own default (document.body). Every call site below spreads
 * this in as `container={usePortalContainer()}` so the prop is simply
 * absent when there's nothing to override.
 */
export function usePortalContainer(): HTMLElement | undefined {
  const ctx = React.useContext(PortalContainerContext);
  return ctx ?? undefined;
}