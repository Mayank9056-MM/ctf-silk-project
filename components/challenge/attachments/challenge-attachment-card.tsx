// components/challenge/attachments/challenge-attachment-card.tsx
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Download } from "lucide-react";

import type { PlayerAttachmentDTO } from "@/modules/challenge/types/challenge.types";
import { formatFileSize, renderAttachmentIcon } from "./attachment-icon";

interface ChallengeAttachmentCardProps {
  attachment: PlayerAttachmentDTO;
}

/**
 * Only ever links to `attachment.downloadUrl` — the authenticated
 * `/api/challenges/[challengeId]/attachments/[attachmentId]` route.
 * `attachment.filePath` doesn't even exist on this DTO, so there is no
 * raw path available to leak even by accident.
 *
 * Download-only, deliberately: the attachment route hardcodes
 * `Content-Disposition: attachment`, forcing a download for every MIME
 * type. There is no "OPEN"/inline-preview affordance because the
 * current backend response headers don't support one.
 *
 * The whole card is the single interactive control (AttachmentTrigger,
 * a real <a>). AttachmentAction's download icon is purely decorative
 * (aria-hidden, unfocusable) and never gets its own click handler,
 * avoiding the nested-interactive-control bug already hit elsewhere in
 * this codebase with `asChild`.
 */
export function ChallengeAttachmentCard({ attachment }: ChallengeAttachmentCardProps) {
  const sizeLabel = formatFileSize(attachment.fileSize);

  return (
    <Attachment orientation="horizontal" className="w-full sm:w-72">
      <AttachmentMedia>{renderAttachmentIcon(attachment.type)}</AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{attachment.fileName}</AttachmentTitle>
        <AttachmentDescription>
          {attachment.type}
          {sizeLabel ? ` · ${sizeLabel}` : ""}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-hidden="true" tabIndex={-1} className="pointer-events-none">
          <Download aria-hidden="true" />
        </AttachmentAction>
      </AttachmentActions>
      <AttachmentTrigger
        render={
           <a
            href={attachment.downloadUrl}
            download={attachment.fileName}
            aria-label={`Download ${attachment.fileName}`}
          />
        }
      />
    </Attachment>
  );
}