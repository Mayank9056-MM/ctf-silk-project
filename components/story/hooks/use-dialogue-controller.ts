"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DialogueLineDTO } from "@/modules/story/types/dialogue.dto";

export type DialoguePhase = "typing" | "line-complete" | "sequence-complete";

const TYPE_SPEED_MS = 18;

interface UseDialogueControllerResult {
  currentLine: DialogueLineDTO | null;
  displayedText: string;
  phase: DialoguePhase;
  lineIndex: number;
  totalLines: number;
  /** Space/Enter/click target — completes the current typewriter instantly, or advances to the next line if already complete. */
  advance: () => void;
}

/**
 * Owns typewriter timing and line-sequencing as pure local UI state —
 * per spec, server owns WHAT the dialogue is (scene.dialogueLines),
 * this hook only owns HOW it's revealed. Resets whenever `lines`
 * changes identity (i.e. a new scene loaded).
 */
export function useDialogueController(lines: DialogueLineDTO[]): UseDialogueControllerResult {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [phase, setPhase] = useState<DialoguePhase>(lines.length > 0 ? "typing" : "sequence-complete");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentLine = lines[lineIndex] ?? null;

  useEffect(() => {
    setLineIndex(0);
    setDisplayedText("");
    setPhase(lines.length > 0 ? "typing" : "sequence-complete");
  }, [lines]);

  useEffect(() => {
    if (!currentLine || phase !== "typing") return;

    let i = 0;
    const content = currentLine.content;
    intervalRef.current = setInterval(() => {
      i += 1;
      setDisplayedText(content.slice(0, i));
      if (i >= content.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase("line-complete");
      }
    }, TYPE_SPEED_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the line itself (by index) changes, not on every displayedText update
  }, [currentLine, lineIndex]);

  const advance = useCallback(() => {
    if (!currentLine) return;

    if (phase === "typing") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayedText(currentLine.content);
      setPhase("line-complete");
      return;
    }

    if (phase === "line-complete") {
      const nextIndex = lineIndex + 1;
      if (nextIndex >= lines.length) {
        setPhase("sequence-complete");
        return;
      }
      setLineIndex(nextIndex);
      setDisplayedText("");
      setPhase("typing");
    }
  }, [currentLine, phase, lineIndex, lines.length]);

  return { currentLine, displayedText, phase, lineIndex, totalLines: lines.length, advance };
}