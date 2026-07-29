import type { ContentStatus } from "@/app/generated/prisma/enums";

/**
 * Player-facing chapter identity — title, slug, and campaign order only.
 * Deliberately excludes `status` (DRAFT/PUBLISHED/ARCHIVED): that's
 * authoring lifecycle metadata a player has no use for. What a player
 * actually needs to know — "can I play this, or is it locked" — is a
 * different, computed concept; see ChapterProgressState below, not a
 * raw ContentStatus value leaking through.
 */
export interface ChapterDTO {
  id: string;
  slug: string;
  title: string;
  order: number;
}

/**
 * A chapter's state relative to ONE specific player's progress — not a
 * property of the chapter itself. The same chapter is LOCKED for a player
 * who hasn't reached it and COMPLETED for one who has; this can never be
 * a field stored on Chapter, only ever computed per request from
 * StoryProgress/SceneCompletion, the same "derive, don't cache" discipline
 * as EventAccess and the planned ChallengeAccess.
 */
export enum ChapterProgressState {
  LOCKED = "LOCKED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

/**
 * One row in the campaign map screen — a ChapterDTO plus the computed
 * state that decides how it renders (locked node vs. active-pulse node
 * vs. completed checkmark, matching the reference build's campaign map).
 */
export interface ChapterMapEntryDTO extends ChapterDTO {
  state: ChapterProgressState;
}

export interface ChapterMapDTO {
  chapters: ChapterMapEntryDTO[];
}

/**
 * Admin-only — includes the real lifecycle status, scene count (for a
 * CMS list view — "Chapter 3 · 6 scenes · Published"), and audit
 * timestamps. Never returned from a player-facing action.
 */
export interface AdminChapterDTO {
  id: string;
  slug: string;
  title: string;
  order: number;
  status: ContentStatus;
  sceneCount: number;
  createdAt: Date;
  updatedAt: Date;
}