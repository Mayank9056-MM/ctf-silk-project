// app/(protected)/story/evidence/[evidenceSlug]/page.tsx
"use client";

import { use } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvidenceBoard } from "@/modules/story/hooks/use-evidence-board";
import { useEvidence } from "@/modules/story/hooks/use-evidence";
import { storyTheme } from "@/components/story/story-theme";
import { StoryLoading } from "@/components/story/states/story-loading";
import { StoryError } from "@/components/story/states/story-error";

/**
 * getEvidence(evidenceId) needs a real Prisma id, but this route only
 * has a slug. There's no getEvidenceBySlug action, so rather than invent
 * one, this resolves the slug against the already-fetched evidence
 * board (which does carry both `slug` and `id` on its AVAILABLE/
 * DISCOVERED items) and only then calls getEvidence with the real id.
 * This composes two existing actions instead of adding a new backend
 * surface — but it means this page can only ever resolve evidence that's
 * unlocked for the CURRENT chapter's board. If evidence detail pages
 * need to work outside that scope, that's a real backend gap (an
 * evidenceId-or-slug lookup with its own unlock check), not something
 * to fake from here.
 */
export default function EvidenceDetailPage({ params }: { params: Promise<{ evidenceSlug: string }> }) {
  const { evidenceSlug } = use(params);
  const board = useEvidenceBoard();

  const boardItem = board.data?.items.find(
    (item): item is Extract<typeof item, { state: "AVAILABLE" | "DISCOVERED" }> =>
      "slug" in item && item.slug === evidenceSlug,
  );

  const evidence = useEvidence(boardItem?.id ?? "");

  if (board.isLoading || (boardItem && evidence.isLoading)) return <StoryLoading />;
  if (board.isError) return <StoryError onRetry={() => board.refetch()} />;

  if (!boardItem) {
    // Either the slug is wrong, or this evidence is LOCKED/not on the
    // current chapter's board — identical response either way, same
    // "locked and unknown must look the same" discipline the backend
    // itself already applies to getEvidence().
    return <StoryError onRetry={() => board.refetch()} />;
  }

  if (evidence.isError || !evidence.data) return <StoryError onRetry={() => evidence.refetch()} />;

  return (
    <div className={cn("mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-8 py-16", storyTheme.background.void)}>
      <div className="flex items-center gap-3">
        <FileText className={cn("size-5", storyTheme.accent.investigation)} aria-hidden="true" />
        <h1 className={cn("text-xl font-bold", storyTheme.text.primary, storyTheme.font.display)}>{evidence.data.title}</h1>
      </div>
      <p className={cn("text-[14px] leading-relaxed", storyTheme.text.secondary, storyTheme.font.body)}>
        {evidence.data.content}
      </p>
      {evidence.data.attachmentUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- attachmentUrl's format (image vs. pdf vs. other) isn't confirmed; next/image would need that guarantee first.
        <img
          src={evidence.data.attachmentUrl}
          alt=""
          className={cn("rounded-sm border", storyTheme.border.normal)}
        />
      )}
    </div>
  );
}