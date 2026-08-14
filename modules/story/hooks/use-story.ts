"use client";

import { useCurrentScene } from "./use-current-scene";

/**
 * Thin composite — NOT a new data-fetching mechanism, just re-exports
 * useCurrentScene's result under the name the spec's file list expects.
 * Kept separate from useCurrentScene itself (rather than just telling
 * every component to import that hook directly) so story-screen.tsx has
 * one obvious top-level entry point, matching the "useStory()" name the
 * spec's Phase 2 section calls out explicitly.
 */
export function useStory() {
  return useCurrentScene();
}