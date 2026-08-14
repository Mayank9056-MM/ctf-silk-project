"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function CompletionTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex h-dvh flex-col items-center justify-center gap-4 bg-black text-center"
    >
      {children}
    </motion.div>
  );
}