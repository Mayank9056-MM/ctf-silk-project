"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface SceneTransitionProps {
  /** Changing this key is what triggers the cross-fade — pass the current scene id. */
  transitionKey: string;
  children: ReactNode;
}

/** Motion owns the cross-fade between two scenes' content; GSAP owns the letterbox/camera choreography around it (story-gsap.ts) — kept as two separate, single-owner concerns rather than one file doing both. */
export function SceneTransition({ transitionKey, children }: SceneTransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}