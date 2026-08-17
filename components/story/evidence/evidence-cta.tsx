// components/story/evidence/evidence-cta.tsx
import Link from "next/link";
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

/** `relative z-30 pointer-events-auto` — same defensive reasoning as
 * ExitStory/ReplayControl. Assumes /story/evidence exists per the route
 * tree — page.tsx content confirmed elsewhere in this session. */
export function EvidenceCta() {
  return (
    <Link
      href="/story/evidence"
      className={cn(
        "relative z-30 pointer-events-auto text-[10px] tracking-[0.1em] uppercase underline-offset-4 hover:underline",
        storyTheme.accent.investigation,
        storyTheme.font.mono,
      )}
    >
      Open Evidence Board
    </Link>
  );
}