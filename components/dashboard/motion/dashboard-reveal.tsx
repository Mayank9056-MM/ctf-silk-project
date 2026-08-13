"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

interface DashboardRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/** Motion owns this — a single fade/slide reveal for panels that mount after the GSAP entrance has already settled (e.g. content that appears once data loads). */
export function DashboardReveal({ children, delay = 0, className }: DashboardRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}