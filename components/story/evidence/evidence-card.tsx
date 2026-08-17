"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { storyTheme } from "@/components/story/story-theme";
import { cn } from "@/lib/utils";
import { EvidencePin } from "./evidence-pin";
import { EvidenceTypeBadge } from "./evidence-type-badge";
import { EvidencePhoto } from "./evidence-photo";
import { EvidenceExhibitTag } from "./evidence-exhibit-tag";

import type { EvidenceBoardItemDTO } from "@/modules/story/types/evidence.dto";
import { exhibitLabel, isImageAttachment } from "./evidence-format";

type UnlockedItem = Extract<
  EvidenceBoardItemDTO,
  { state: "AVAILABLE" | "DISCOVERED" }
>;

function tiltForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((hash % 7) - 3) * 1.2;
}

/**
 * Two presentations, chosen by whether attachmentUrl is image-like:
 * a taped photograph (the FBI-corkboard treatment this task asked for)
 * when there's a real webp/png to show, or the previous label-only
 * case-file card as a graceful fallback for text-only evidence — never
 * an empty/broken image placeholder either way.
 */
export function EvidenceCard({ item }: { item: UnlockedItem }) {
  const tilt = tiltForId(item.id);
  const isNew = item.state === "AVAILABLE";
  const hasPhoto = isImageAttachment(item.attachmentUrl);
  const label = exhibitLabel(item.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: -18, rotate: tilt * 2 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={{ rotate: 0, y: -4, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="relative"
    >
      <EvidencePin
        color={isNew ? "var(--sr-crimson-hot)" : "var(--sr-steel)"}
      />
      <Link href={`/story/evidence/${item.slug}`} className="block">
        {hasPhoto ? (
          <div className="relative">
            <EvidencePhoto src={item.attachmentUrl ?? ""} alt={item.title} />
            {!isNew && <span className="sr-evidence-stamp">Logged</span>}
            <div className="mt-2 flex items-center justify-between gap-2 px-1">
              <EvidenceExhibitTag label={label} />
              {isNew && (
                <span className="animate-pulse text-[8px] font-bold tracking-[0.1em] text-(--sr-crimson-hot) uppercase">
                  New
                </span>
              )}
            </div>
            <p
              className={cn(
                "mt-1 px-1 text-[12.5px] font-medium leading-snug",
                storyTheme.text.primary,
                storyTheme.font.body,
              )}
            >
              {item.title}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-[2px] border p-4 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.7)] transition-colors hover:border-(--sr-crimson-hot)",
              storyTheme.border.normal,
            )}
            style={{ background: "linear-gradient(180deg, #17140f, #100e0b)" }}
          >
            <div className="flex items-start justify-between gap-2">
              <EvidenceTypeBadge type={item.type} />
              {isNew && (
                <span className="animate-pulse text-[8px] font-bold tracking-[0.1em] text-(--sr-crimson-hot) uppercase">
                  New
                </span>
              )}
            </div>
            <p
              className={cn(
                "mt-3 text-[13px] font-medium leading-snug",
                storyTheme.text.primary,
                storyTheme.font.body,
              )}
            >
              {item.title}
            </p>
            <div className="mt-2">
              <EvidenceExhibitTag label={label} />
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
