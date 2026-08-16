// components/challenge/attachments/challenge-attachments.tsx
import { cn } from "@/lib/utils";
import { storyTheme } from "@/components/story/story-theme";
import { AttachmentGroup } from "@/components/ui/attachment";

import type { PlayerAttachmentDTO } from "@/modules/challenge/types/challenge.types";
import { ChallengeAttachmentCard } from "./challenge-attachment-card";

interface ChallengeAttachmentsProps {
  attachments: PlayerAttachmentDTO[];
}

export function ChallengeAttachments({ attachments }: ChallengeAttachmentsProps) {
  if (attachments.length === 0) return null;

  return (
    <section>
      <h2 className={cn("mb-3 text-[11px] tracking-[0.16em] uppercase", storyTheme.text.muted, storyTheme.font.mono)}>
        Evidence Attached
      </h2>
      <AttachmentGroup>
        {attachments.map((attachment) => (
          <ChallengeAttachmentCard key={attachment.id} attachment={attachment} />
        ))}
      </AttachmentGroup>
    </section>
  );
}