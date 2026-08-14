"use client";

import { motion, useReducedMotion } from "motion/react";

interface CinematicIntroProps {
  chapterLabel: string;
  title: string;
  onComplete: () => void;
}

/**
 * A brief chapter title card — "CHAPTER 01 / THE FIRST THREAD" — held
 * for a fixed beat then dismissed. Text-only per the asset-blocked
 * constraint; nothing here needs an image.
 */
export function CinematicIntro({ chapterLabel, title, onComplete }: CinematicIntroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute inset-0 z-[25] flex flex-col items-center justify-center gap-3 bg-(--sr-bg-void) text-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.5 }}
      onAnimationComplete={() => {
        const timeout = setTimeout(onComplete, reduceMotion ? 400 : 1800);
        return () => clearTimeout(timeout);
      }}
    >
      <span className="sr-font-mono text-[11px] tracking-[0.3em] text-(--sr-crimson-hot) uppercase">
        {chapterLabel}
      </span>
      <h2 className="sr-font-display text-3xl font-bold text-(--sr-text-primary)">{title}</h2>
    </motion.div>
  );
}