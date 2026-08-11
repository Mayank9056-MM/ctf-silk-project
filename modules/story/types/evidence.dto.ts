import type { ContentStatus, EvidenceType } from "@/app/generated/prisma/enums";
import { ChapterDTO } from "./chapter.dto";

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

export interface EvidencePreviewDTO {
  id: string;
  title: string;
  type: EvidenceType;
}

/**
 * A player's investigation-board state for one evidence item, relative
 * to their OWN progress — never a stored value, always computed fresh
 * per request (same "derive, don't cache" discipline as
 * ChapterProgressState).
 */
export enum EvidenceAccessState {
  LOCKED = "LOCKED",
  AVAILABLE = "AVAILABLE",
  DISCOVERED = "DISCOVERED",
}

/**
 * A discriminated union, not optional fields on a flat shape — a LOCKED
 * item is structurally incapable of carrying title/type/attachmentUrl.
 * This is deliberate: the type system, not a runtime `if`, is what
 * prevents a future edit from accidentally attaching content to a
 * locked item. Never includes `content` at all, even for unlocked
 * items — the board is a listing; full content is only ever returned
 * by evidenceService.getEvidence() once a player actually opens one.
 */
export type EvidenceBoardItemDTO =
  | { id: string; state: EvidenceAccessState.LOCKED }
  | {
      id: string;
      state: EvidenceAccessState.AVAILABLE | EvidenceAccessState.DISCOVERED;
      slug: string;
      title: string;
      type: EvidenceType;
      attachmentUrl: string | null;
    };

/**
 * Player-specific and chapter-scoped — see evidence.service.ts's
 * getEvidenceBoard for why "chapter" is singular here rather than a
 * global list.
 */
export interface EvidenceBoardDTO {
  chapter: ChapterDTO;
  items: EvidenceBoardItemDTO[];
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
