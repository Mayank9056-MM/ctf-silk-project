"use client";

import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { storyTheme } from "@/components/story/story-theme";
import { cn } from "@/lib/utils";
import { EvidencePin } from "./evidence-pin";

function tiltForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((hash % 7) - 3) * 1.2;
}

export function EvidenceCardLocked({ id }: { id: string }) {
  const tilt = tiltForId(id);
  return (
    <motion.div
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="relative"
    >
      <EvidencePin color="var(--sr-steel)" />
      <div
        className={cn("flex flex-col items-center justify-center gap-2 rounded-[2px] border p-4 opacity-70", storyTheme.border.subtle)}
        style={{ background: "repeating-linear-gradient(135deg, #14110d 0 6px, #100e0b 6px 12px)" }}
      >
        <Lock className={cn("size-4", storyTheme.text.muted)} aria-hidden="true" />
        <span className={cn("text-[9px] tracking-[0.14em] uppercase", storyTheme.text.muted, storyTheme.font.mono)}>Classified</span>
      </div>
    </motion.div>
  );
}