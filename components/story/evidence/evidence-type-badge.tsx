import { FileText, ImageIcon, Video, Mic, Fingerprint, MapPin, File } from "lucide-react";
import { storyTheme } from "@/components/story/story-theme";
import { cn } from "@/lib/utils";
import type { EvidenceType } from "@/app/generated/prisma/enums";

/**
 * EvidenceType's real enum members are still unconfirmed — same
 * defensive string-matching approach already used for
 * AnnouncementPriorityBadge on the dashboard, rather than a
 * Record<EvidenceType, Icon> that would fail to compile if guessed
 * wrong. Falls back to a generic file icon for anything unmatched.
 */
function resolveIcon(type: string) {
  const t = type.toUpperCase();
  if (t.includes("PHOTO") || t.includes("IMAGE")) return ImageIcon;
  if (t.includes("VIDEO")) return Video;
  if (t.includes("AUDIO") || t.includes("RECORDING")) return Mic;
  if (t.includes("FORENSIC") || t.includes("PRINT")) return Fingerprint;
  if (t.includes("MAP") || t.includes("LOCATION")) return MapPin;
  if (t.includes("DOCUMENT") || t.includes("REPORT") || t.includes("FILE")) return FileText;
  return File;
}

export function EvidenceTypeBadge({ type }: { type: EvidenceType }) {
  const Icon = resolveIcon(String(type));
  return (
    <span className={cn("inline-flex items-center gap-1 text-[8.5px] tracking-[0.1em] uppercase", storyTheme.text.muted, storyTheme.font.mono)}>
      <Icon className="size-3" aria-hidden="true" />
      {String(type).replace(/_/g, " ")}
    </span>
  );
}