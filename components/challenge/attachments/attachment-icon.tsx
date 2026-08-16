// components/challenge/attachments/attachment-icon.tsx
import { Archive, File, FileText, Image as ImageIcon, Music, Video } from "lucide-react";
import type { ChallengeAttachmentType } from "@/app/generated/prisma/enums";
import type { ReactElement } from "react";

/**
 * Returns a rendered element, not a component reference. Rendering via
 * <Icon /> where `Icon` was assigned from a function call trips React
 * 19's "Cannot create components during render" check — it can't prove
 * the returned reference is stable across renders without memoization,
 * even though every branch here is actually a stable module-level
 * export. Returning the element directly sidesteps the check entirely:
 * this is just a function call producing JSX, the same as any other
 * conditional-render helper.
 */
export function renderAttachmentIcon(type: ChallengeAttachmentType): ReactElement {
  switch (type) {
    case "IMAGE":
      return <ImageIcon aria-hidden="true" />;
    case "PDF":
      return <FileText aria-hidden="true" />;
    case "AUDIO":
      return <Music aria-hidden="true" />;
    case "VIDEO":
      return <Video aria-hidden="true" />;
    case "ARCHIVE":
      return <Archive aria-hidden="true" />;
    case "OTHER":
    default:
      return <File aria-hidden="true" />;
  }
}

/** Plain, dependency-free byte formatter — no existing shared formatter
 * for this was in view, so this stays local rather than reaching into
 * dashboard-format.ts's unseen contents. */
export function formatFileSize(bytes: number | null): string | null {
  if (bytes === null) return null;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}