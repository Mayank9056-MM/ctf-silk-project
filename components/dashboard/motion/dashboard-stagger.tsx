"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
};

/** Motion owns list changes — leaderboard rows, notification items, announcement items. Each item exits/enters independently via AnimatePresence at the call site. */
export function DashboardStagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.ul
      className={className}
      initial={reduceMotion ? "show" : "hidden"}
      animate="show"
      variants={listVariants}
    >
      {children}
    </motion.ul>
  );
}

export function DashboardStaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.li className={className} variants={reduceMotion ? undefined : itemVariants}>
      {children}
    </motion.li>
  );
}

export { AnimatePresence };