// app/(protected)/story/evidence/page.tsx
"use client";

import Link from "next/link";
import { Lock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvidenceBoard } from "@/modules/story/hooks/use-evidence-board";
import { storyTheme } from "@/components/story/story-theme";
import { StoryLoading } from "@/components/story/states/story-loading";
import { StoryError } from "@/components/story/states/story-error";
import { StoryEmpty } from "@/components/story/states/story-empty";

export default function EvidenceBoardPage() {
  const { data, isLoading, isError, refetch } = useEvidenceBoard();

  if (isLoading) return <StoryLoading />;
  if (isError || !data) return <StoryError onRetry={() => refetch()} />;
  if (data.items.length === 0) return <StoryEmpty message="No evidence recovered for this chapter yet." />;

  return (
    <div className={cn("min-h-dvh px-8 py-10", storyTheme.background.void)}>
      <p className={cn("mb-8 text-[10px] tracking-[0.24em] uppercase", storyTheme.text.muted, storyTheme.font.mono)}>
        Chapter {String(data.chapter.order).padStart(2, "0")} — {data.chapter.title} · Evidence Board
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((item) => {
          if (item.state === "LOCKED") {
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-sm border p-4 opacity-40",
                  storyTheme.border.subtle,
                  storyTheme.background.surface,
                )}
              >
                <Lock className={cn("size-4", storyTheme.text.muted)} aria-hidden="true" />
                <span className={cn("text-[11px] uppercase tracking-[0.08em]", storyTheme.text.muted, storyTheme.font.mono)}>
                  Classified
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={`/story/evidence/${item.slug}`}
              className={cn(
                "flex items-center gap-3 rounded-sm border p-4 transition-colors hover:border-(--sr-crimson-hot)",
                storyTheme.border.normal,
                storyTheme.background.surface,
              )}
            >
              <FileText className={cn("size-4", storyTheme.accent.investigation)} aria-hidden="true" />
              <span className={cn("text-[12.5px]", storyTheme.text.primary, storyTheme.font.body)}>{item.title}</span>
              {item.state === "AVAILABLE" && (
                <span className={cn("ml-auto text-[9px] uppercase tracking-[0.08em]", storyTheme.accent.crimson, storyTheme.font.mono)}>
                  New
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}