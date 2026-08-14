import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvidencePreviewDTO } from "@/modules/story/types/evidence.dto";
import { storyTheme } from "../story-theme";

/** Uses a single generic icon regardless of EvidenceType — that enum's real members are unconfirmed (see blockers list), so no type-conditional iconography yet. Swap for a Record<EvidenceType, LucideIcon> once known. */
export function EvidencePreview({ evidence }: { evidence: EvidencePreviewDTO }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-sm border p-3", storyTheme.border.normal, storyTheme.background.surface)}>
      <FileText className={cn("size-4", storyTheme.accent.investigation)} aria-hidden="true" />
      <span className={cn("text-[12.5px]", storyTheme.text.primary, storyTheme.font.body)}>{evidence.title}</span>
    </div>
  );
}