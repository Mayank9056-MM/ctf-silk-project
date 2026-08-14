"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Motion-owned presence transition for character layers swapping speaker — separate from scene-transition.tsx (which cross-fades the whole scene) since a speaker change within one scene is a much smaller, faster beat. */
export function CharacterTransition({ speakerKey, children }: { speakerKey: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={speakerKey}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}