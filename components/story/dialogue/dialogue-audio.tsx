"use client";

import { useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

interface DialogueAudioProps {
  /** Comes directly off DialogueLineDTO.audioUrl — no resolver needed, the DTO already provides a full, safe URL for this field. */
  audioUrl: string | null;
  /** Restart playback whenever the line changes. */
  lineKey: string;
}

/** Auto-plays the current line's voice audio if present; shows a small indicator regardless, per spec's "audio indicator when audioUrl exists." No controls exposed — this is ambient narration, not a player. */
export function DialogueAudio({ audioUrl, lineKey }: DialogueAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    void audioRef.current.play().catch(() => {
      // Autoplay can be blocked by the browser — fail silently, dialogue text remains fully readable without audio.
    });
  }, [audioUrl, lineKey]);

  if (!audioUrl) return null;

  return (
    <>
      <audio ref={audioRef} src={audioUrl} aria-hidden="true" />
      <Volume2 className={cn("size-3", storyTheme.text.muted)} aria-hidden="true" />
    </>
  );
}