"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { storyTheme } from "@/components/story/story-theme";
import { cn } from "@/lib/utils";
import { EvidencePin } from "./evidence-pin";
import { EvidenceTypeBadge } from "./evidence-type-badge";
import type { EvidenceBoardItemDTO } from "@/modules/story/types/evidence.dto";

type UnlockedItem = Extract<EvidenceBoardItemDTO, { state: "AVAILABLE" | "DISCOVERED" }>;

/** Deterministic pseudo-random tilt per item id — identical on every render/SSR pass (no hydration mismatch), unlike Math.random(). */
function tiltForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((hash % 7) - 3) * 1.2;
}

export function EvidenceCard({ item }: { item: UnlockedItem }) {
  const tilt = tiltForId(item.id);
  const isNew = item.state === "AVAILABLE";

  return (
    <motion.div
      initial={{ opacity: 0, y: -18, rotate: tilt * 2 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={{ rotate: 0, y: -4, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="relative"
    >
      <EvidencePin color={isNew ? "var(--sr-crimson-hot)" : "var(--sr-steel)"} />
      <Link
        href={`/story/evidence/${item.slug}`}
        className={cn(
          "block rounded-[2px] border p-4 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.7)] transition-colors hover:border-(--sr-crimson-hot)",
          storyTheme.border.normal,
        )}
        style={{ background: "linear-gradient(180deg, #17140f, #100e0b)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <EvidenceTypeBadge type={item.type} />
          {isNew && (
            <span className="animate-pulse text-[8px] font-bold tracking-[0.1em] text-(--sr-crimson-hot) uppercase">New</span>
          )}
        </div>
        <p className={cn("mt-3 text-[13px] font-medium leading-snug", storyTheme.text.primary, storyTheme.font.body)}>
          {item.title}
        </p>
      </Link>
    </motion.div>
  );
}