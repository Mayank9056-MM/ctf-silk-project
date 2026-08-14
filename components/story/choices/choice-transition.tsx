"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function ChoiceTransition({ show, children }: { show: boolean; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}