import type { ContentStatus, EvidenceType } from "@/app/generated/prisma/enums";

/**
 * One item on the player's investigation board. `content` is markdown/
 * caption text — the same "brief-card" style description shown in the
 * reference build's evidence cards (e.g. "Wallet Ledger — same source
 * wallet, three separate buyers"). `attachmentUrl` nullable: a piece of
 * evidence can be pure text (a chat-log excerpt) with no backing image
 * or file at all.
 */
export interface EvidenceDTO {
  id: string;
  slug: string;
  title: string;
  type: EvidenceType;
  content: string;
  attachmentUrl: string | null;
}

export interface EvidenceBoardDTO {
  items: EvidenceDTO[];
}

/**
 * A lighter preview shape for embedding inside a SceneDTO — a scene of
 * type EVIDENCE_REVEAL announces which evidence it unlocked without
 * needing the player to separately fetch the full board. Deliberately not
 * the same type as EvidenceDTO even though the fields overlap: this one
 * is scoped to "just unlocked, shown inline in a scene," the other to
 * "the full board view" — keeping them distinct means adding a
 * board-only field later (e.g. a `connections` array for the corkboard's
 * string-linking) never has to ripple into the inline-preview shape that
 * has no use for it.
 */
export interface EvidencePreviewDTO {
  id: string;
  title: string;
  type: EvidenceType;
}

/**
 * Admin-only — full authoring fidelity, including status and audit
 * timestamps. Never returned from a player-facing action.
 */
export interface AdminEvidenceDTO {
  id: string;
  slug: string;
  title: string;
  type: EvidenceType;
  content: string;
  attachmentUrl: string | null;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}