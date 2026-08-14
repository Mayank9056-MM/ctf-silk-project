"use client";

import { useEffect, useState } from "react";

export type TransitionPhase = "entering" | "idle" | "leaving";

/** Drives the letterbox/cross-fade phase around a scene id change — pure local UI state, the scene DATA itself always comes from useCurrentScene/useAdvanceScene/useSelectChoice's cache. */
export function useSceneTransition(sceneId: string | undefined): TransitionPhase {
  const [phase, setPhase] = useState<TransitionPhase>("entering");

  useEffect(() => {
    setPhase("entering");
    const timeout = setTimeout(() => setPhase("idle"), 400);
    return () => clearTimeout(timeout);
  }, [sceneId]);

  return phase;
}