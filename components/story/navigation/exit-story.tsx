// components/story/navigation/exit-story.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

/**
 * Custom overlay rather than shadcn Dialog/AlertDialog.
 *
 * `relative z-30 pointer-events-auto` on the trigger button and
 * `z-[60] pointer-events-auto` on the confirmation overlay (bumped from
 * z-[40]) — explicit, not relying on stacking-context inheritance from
 * StoryNavigation's wrapper. CinematicLetterbox sits at z-20 and
 * SceneVignette is unindexed-but-pointer-events-none, so z-[60] clears
 * every known stage layer with margin, rather than just barely beating
 * the letterbox at 20.
 */
export function ExitStory() {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Exit investigation"
        className={cn(
          "relative z-30 pointer-events-auto rounded-full p-1.5 transition-colors hover:bg-(--sr-bg-surface)",
          storyTheme.text.muted,
        )}
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
            role="alertdialog"
            aria-modal="true"
          >
            <div className={cn("flex flex-col gap-4 rounded-sm border p-6 text-center", storyTheme.border.normal, storyTheme.background.elevated)}>
              <p className={cn("text-[13px]", storyTheme.text.primary, storyTheme.font.body)}>
                Leave the investigation? Your progress is saved automatically.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className={cn("text-[11px] uppercase tracking-[0.1em]", storyTheme.text.muted)}
                >
                  Stay
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-sm bg-(--sr-crimson-hot) px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-white"
                >
                  Exit
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}