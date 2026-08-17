// app/(protected)/story/evidence/[evidenceSlug]/page.tsx
"use client";

import { use } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowLeft, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvidenceBoard } from "@/modules/story/hooks/use-evidence-board";
import { useEvidence } from "@/modules/story/hooks/use-evidence";
import { storyTheme } from "@/components/story/story-theme";
import { StoryLoading } from "@/components/story/states/story-loading";
import { StoryError } from "@/components/story/states/story-error";
import { EvidenceExhibitTag } from "@/components/story/evidence/evidence-exhibit-tag";
import { EvidenceTypeBadge } from "@/components/story/evidence/evidence-type-badge";
import { EvidenceDetailImage } from "@/components/story/evidence/evidence-detail-image";
import { isImageAttachment, exhibitLabel } from "@/components/story/evidence/evidence-format";

/**
 * Kept as a dedicated route (not a modal/dialog) — matches routing
 * already built and working before this pass.
 *
 * Two back-nav links now, deliberately distinct destinations:
 *   - "Evidence Board" → /story/evidence (unchanged) — the list this
 *     detail item came from.
 *   - "Back to Story" → /story (new, per this request) — returns to
 *     the live scene/cutscene, same destination ExitStory's "Exit"
 *     button targets conceptually but without the confirmation prompt,
 *     since navigating away from a detail page to continue Story isn't
 *     "leaving the investigation" the way exiting to /dashboard is.
 *
 * Both links carry the same `relative z-30 pointer-events-auto`
 * defensive treatment as the story-nav components — this page doesn't
 * use GSAP entrance animation on these specific elements (only the
 * Motion fade below), so this is precautionary consistency, not a
 * confirmed bug fix here.
 */
export default function EvidenceDetailPage({ params }: { params: Promise<{ evidenceSlug: string }> }) {
  const { evidenceSlug } = use(params);
  const board = useEvidenceBoard();
  const reduceMotion = useReducedMotion();

  const boardItem = board.data?.items.find(
    (item): item is Extract<typeof item, { state: "AVAILABLE" | "DISCOVERED" }> =>
      "slug" in item && item.slug === evidenceSlug,
  );

  const evidence = useEvidence(boardItem?.id ?? "");

  if (board.isLoading || (boardItem && evidence.isLoading)) return <StoryLoading />;
  if (board.isError) return <StoryError onRetry={() => board.refetch()} />;
  if (!boardItem) return <StoryError onRetry={() => board.refetch()} />;
  if (evidence.isError || !evidence.data) return <StoryError onRetry={() => evidence.refetch()} />;

  const hasPhoto = isImageAttachment(evidence.data.attachmentUrl);
  const label = exhibitLabel(evidence.data.id);

  return (
    <div className={cn("sr-evidence-detail-stage min-h-dvh", storyTheme.background.void)}>
      <div className="sr-evidence-detail-ember" aria-hidden="true" />

      <div className="relative z-[1] mx-auto max-w-4xl px-8 py-14">
        <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/story/evidence"
            className={cn(
              "relative z-30 inline-flex items-center gap-1.5 pointer-events-auto text-[10px] tracking-[0.1em] uppercase transition-colors hover:text-(--sr-crimson-hot)",
              storyTheme.text.muted,
              storyTheme.font.mono,
            )}
          >
            <ArrowLeft className="size-3" aria-hidden="true" />
            Evidence Board
          </Link>

          <Link
            href="/story"
            className={cn(
              "relative z-30 inline-flex items-center gap-1.5 pointer-events-auto text-[10px] tracking-[0.1em] uppercase transition-colors hover:text-(--sr-crimson-hot)",
              storyTheme.text.muted,
              storyTheme.font.mono,
            )}
          >
            <ArrowLeft className="size-3" aria-hidden="true" />
            Back to Story
          </Link>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {hasPhoto && <EvidenceDetailImage src={evidence.data.attachmentUrl!} alt={evidence.data.title} />}

          <div className={cn("flex flex-col gap-5", !hasPhoto && "lg:col-span-2")}>
            <div className="flex items-center gap-3">
              <EvidenceExhibitTag label={label} />
              <EvidenceTypeBadge type={evidence.data.type} />
            </div>

            <h1 className={cn("text-3xl font-bold leading-tight", storyTheme.text.primary, storyTheme.font.display)}>
              {evidence.data.title}
            </h1>

            <p className={cn("text-[15px] leading-relaxed", storyTheme.text.secondary, storyTheme.font.body)}>
              {evidence.data.content}
            </p>

            {!hasPhoto && evidence.data.attachmentUrl && (
              <a
                href={evidence.data.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "relative z-30 pointer-events-auto inline-flex w-fit items-center gap-2 rounded-sm border p-3 text-[12px] transition-colors hover:border-(--sr-crimson-hot)",
                  storyTheme.border.normal,
                  storyTheme.text.secondary,
                  storyTheme.font.mono,
                )}
              >
                <Paperclip className="size-3.5" aria-hidden="true" />
                View Attachment
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}