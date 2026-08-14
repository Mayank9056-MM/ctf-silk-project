import type { ReactNode } from "react";

/** Top-level route wrapper — reserved for anything that must exist above the stage itself (e.g. a future global letterbox or exit-confirmation portal root). Kept minimal and separate from story-stage.tsx per the spec's own screen/shell/stage split. */
export function StoryShell({ children }: { children: ReactNode }) {
  return <div className="relative">{children}</div>;
}