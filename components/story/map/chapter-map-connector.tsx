import type { ChapterProgressState } from "@/modules/story/types/chapter.dto";

export function ChapterMapConnector({ state }: { state: ChapterProgressState }) {
  return (
    <div
      className="h-px flex-1"
      style={{ background: state === "LOCKED" ? "var(--sr-border-subtle)" : "var(--sr-crimson-hot)" }}
      aria-hidden="true"
    />
  );
}