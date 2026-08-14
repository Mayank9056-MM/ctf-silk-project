"use client";

import { useEffect } from "react";

/** Space/Enter → advance, Escape → exit (caller supplies both handlers). Attached at the story-screen level, not per-component, so keyboard advancement works regardless of where focus currently sits — mirroring the click-anywhere-to-advance convention of the genre. */
export function useStoryKeyboard(onAdvance: () => void, onExit?: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ["BUTTON", "A", "INPUT"].includes(e.target.tagName)) return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        onAdvance();
      }
      if (e.code === "Escape") {
        onExit?.();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onAdvance, onExit]);
}