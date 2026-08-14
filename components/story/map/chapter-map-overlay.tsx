"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

export function ChapterMapOverlay({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[35] flex items-center justify-center bg-black/85"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}