"use client";

import { useStory } from "./use-story";

interface StoryAccessResult {
  isLoading: boolean;
  isError: boolean;
  /** The backend's own user-safe error message, if any — displayed verbatim by story-unavailable.tsx, never parsed into a synthetic access-state enum client-side (see the note below). */
  message: string | null;
}

/**
 * Deliberately does NOT reconstruct the full StoryAccessState union
 * (EVENT_NOT_LIVE / NOT_STARTED / IN_PROGRESS / COMPLETED) client-side.
 * That would mean string-matching getCurrentScene's thrown error
 * message ("The event hasn't started yet." vs. "...temporarily
 * paused." vs. "...has ended.") to guess which case applies — fragile,
 * and arguably the kind of business-logic duplication the spec
 * explicitly prohibits ("if (chapter === 2) unlock scene"). There is
 * no dedicated getStoryAccess() action returning a structured
 * StoryAccess value today. This hook instead surfaces exactly what's
 * safely knowable — loading, error, and the backend's own crafted
 * message — and lets story-screen.tsx route between story-loading /
 * story-unavailable / normal render on that basis. IN_PROGRESS vs.
 * COMPLETED is instead read directly off progress.status once data
 * successfully loads (see story-screen.tsx), not derived here.
 */
export function useStoryAccess(): StoryAccessResult {
  const { isLoading, isError, error } = useStory();
  return {
    isLoading,
    isError,
    message: isError && error instanceof Error ? error.message : null,
  };
}
