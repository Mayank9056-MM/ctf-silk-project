import type { Transition } from "motion/react";

/** Centralized Motion transition presets so scene/choice/dialogue components share consistent timing instead of each inventing its own duration/easing. */
export const STORY_TRANSITIONS = {
  sceneCrossfade: { duration: 0.35, ease: "easeInOut" } satisfies Transition,
  dialogueLine: { duration: 0.2 } satisfies Transition,
  choiceStagger: { duration: 0.3, staggerChildren: 0.05 } satisfies Transition,
  reveal: { duration: 0.4, ease: "easeOut" } satisfies Transition,
} as const;