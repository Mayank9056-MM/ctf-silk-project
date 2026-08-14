import Link from "next/link";
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

/** Assumes /story/evidence exists per the route tree — but its actual page.tsx content is unseen (blocker #3), so this link is wired to the path only, not integrated with that page's expected props/params. */
export function EvidenceCta() {
  return (
    <Link
      href="/story/evidence"
      className={cn(
        "text-[10px] tracking-[0.1em] uppercase underline-offset-4 hover:underline",
        storyTheme.accent.investigation,
        storyTheme.font.mono,
      )}
    >
      Open Evidence Board
    </Link>
  );
}