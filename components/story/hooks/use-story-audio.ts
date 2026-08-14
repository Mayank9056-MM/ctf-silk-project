"use client";

import { useEffect, useRef } from "react";

/** Thin wrapper for one persistent <audio> element reused across dialogue lines — DialogueAudio.tsx handles the per-line case inline; this hook exists for a future ambient/music layer that isn't tied to one specific dialogue line. Not currently mounted anywhere, since no ambient-audio asset source exists yet (same blocker as background images). */
export function useStoryAudio(url: string | null) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!url) return;
    const audio = new Audio(url);
    ref.current = audio;
    return () => {
      audio.pause();
      ref.current = null;
    };
  }, [url]);

  return ref;
}