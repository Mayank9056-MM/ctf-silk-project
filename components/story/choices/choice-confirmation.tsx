"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ChoiceDTO } from "@/modules/story/types/scene.dto";
import { storyTheme } from "../story-theme";

/** Brief, non-blocking confirmation of what was picked, shown while the mutation is pending — never previews or implies a destination, since the frontend has no knowledge of nextSceneId. */
export function ChoiceConfirmation({ choice }: { choice: ChoiceDTO }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("flex items-center gap-2 text-[12px] italic", storyTheme.accent.crimson, storyTheme.font.body)}
    >
      <span aria-hidden="true">✓</span>
      {choice.label}
    </motion.div>
  );
}