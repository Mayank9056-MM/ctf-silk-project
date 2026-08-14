import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { storyTheme } from "../story-theme";

interface ReplayControlProps {
  sceneSlug: string;
}

/** Only rendered by callers where SceneDTO.isCompleted is true — this component itself doesn't check that, it trusts the caller (per "server owns access, frontend renders"). Route shape assumes /story/replay/[sceneSlug] per the inspected tree; page.tsx contents unseen. */
export function ReplayControl({ sceneSlug }: ReplayControlProps) {
  return (
    <Link
      href={`/story/replay/${sceneSlug}`}
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase transition-colors hover:text-(--sr-crimson-hot)",
        storyTheme.text.muted,
        storyTheme.font.mono,
      )}
    >
      <RotateCcw className="size-3" aria-hidden="true" />
      Replay
    </Link>
  );
}