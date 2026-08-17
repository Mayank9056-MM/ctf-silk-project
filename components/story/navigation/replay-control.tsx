// components/story/navigation/replay-control.tsx
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

interface ReplayControlProps {
  sceneSlug: string;
}

/** `relative z-30 pointer-events-auto` — same defensive reasoning as
 * ExitStory: guarantees this is clickable regardless of any ancestor
 * entrance-animation state. Route shape assumes /story/replay/[sceneSlug]
 * per the inspected tree; page.tsx contents unseen. */
export function ReplayControl({ sceneSlug }: ReplayControlProps) {
  return (
    <Link
      href={`/story/replay/${sceneSlug}`}
      className={cn(
        "relative z-30 pointer-events-auto inline-flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase transition-colors hover:text-(--sr-crimson-hot)",
        storyTheme.text.muted,
        storyTheme.font.mono,
      )}
    >
      <RotateCcw className="size-3" aria-hidden="true" />
      Replay
    </Link>
  );
}