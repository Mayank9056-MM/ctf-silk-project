"use client";

import { motion, useReducedMotion } from "motion/react";

interface CinematicOutroProps {
  label: string;
  onComplete: () => void;
}

/** The two-part "text card" pattern the story bible's own PROLOGUE.md establishes ("People lie." / beat / "Evidence doesn't.") — generalized here to any single closing line per chapter, not hardcoded to that specific quote (which stays where it's canonically used, on the dashboard hero). */
export function CinematicOutro({ label, onComplete }: CinematicOutroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute inset-0 z-[25] flex items-center justify-center bg-black text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.6 }}
      onAnimationComplete={() => {
        const timeout = setTimeout(onComplete, reduceMotion ? 400 : 2000);
        return () => clearTimeout(timeout);
      }}
    >
      <span className="sr-font-display text-xl tracking-wide text-(--sr-text-primary)">{label}</span>
    </motion.div>
  );
}