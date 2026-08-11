import type { Evidence } from "@/app/generated/prisma/client";
import {
  EvidenceDTO,
  EvidencePreviewDTO,
  AdminEvidenceDTO,
  EvidenceAccessState,
  EvidenceBoardItemDTO,
} from "../types/evidence.dto";

export function toEvidenceDTO(evidence: Evidence): EvidenceDTO {
  return {
    id: evidence.id,
    slug: evidence.slug,
    title: evidence.title,
    type: evidence.type,
    content: evidence.content,
    attachmentUrl: evidence.attachmentUrl,
  };
}

export function toEvidenceDTOList(items: Evidence[]): EvidenceDTO[] {
  return items.map(toEvidenceDTO);
}

/**
 * The lighter shape embedded inside a SceneDTO for an EVIDENCE_REVEAL
 * scene. Deliberately not built from toEvidenceDTO's output (dropping
 * fields back off) — same reasoning as dialogue.mapper.ts's admin/player
 * split: this reads the source row independently so the two shapes stay
 * free to diverge, rather than one being structurally derived from the
 * other.
 */
export function toEvidencePreviewDTO(evidence: Evidence): EvidencePreviewDTO {
  return {
    id: evidence.id,
    title: evidence.title,
    type: evidence.type,
  };
}

/**
 * ADMIN-only — the full row including `status` and audit timestamps.
 */
export function toAdminEvidenceDTO(evidence: Evidence): AdminEvidenceDTO {
  return {
    id: evidence.id,
    slug: evidence.slug,
    title: evidence.title,
    type: evidence.type,
    content: evidence.content,
    attachmentUrl: evidence.attachmentUrl,
    status: evidence.status,
    createdAt: evidence.createdAt,
    updatedAt: evidence.updatedAt,
  };
}

export function toAdminEvidenceDTOList(items: Evidence[]): AdminEvidenceDTO[] {
  return items.map(toAdminEvidenceDTO);
}

export function toUnlockedEvidenceBoardItemDTO(
  evidence: Evidence,
  state: EvidenceAccessState.AVAILABLE | EvidenceAccessState.DISCOVERED,
): EvidenceBoardItemDTO {
  return {
    id: evidence.id,
    state,
    slug: evidence.slug,
    title: evidence.title,
    type: evidence.type,
    attachmentUrl: evidence.attachmentUrl,
  };
}

export function toLockedEvidenceBoardItemDTO(
  evidenceId: string,
): EvidenceBoardItemDTO {
  return { id: evidenceId, state: EvidenceAccessState.LOCKED };
}
