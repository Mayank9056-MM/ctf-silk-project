import type { StoryProgressStatus } from "@/app/generated/prisma/enums";

/**
 * A player's own progress through the story — "where am I, how far have
 * I come." Chapter/scene identified by slug, not id: slugs are what
 * routes are built from (/story/[chapterSlug]/[sceneSlug]), so the
 * client never needs a second lookup just to know where to navigate.
 */
export interface StoryProgressDTO {
  status: StoryProgressStatus;
  currentChapterSlug: string | null;
  currentSceneSlug: string | null;
  completedSceneCount: number;
  startedAt: Date;
  completedAt: Date | null;
}

/**
 * One entry in a player's completion history — a "your investigation so
 * far" recap view, or raw material for post-event analytics.
 * `sceneTitle` included so the client renders a readable list without a
 * second fetch per row.
 */
export interface SceneCompletionDTO {
  sceneSlug: string | null;
  sceneTitle: string | null;
  completedAt: Date;
}

export interface StoryHistoryDTO {
  completions: SceneCompletionDTO[];
}

/**
 * Admin-only — one row in a "who's where / who's stuck" live dashboard
 * during the event. Includes identity (a player's own progress view
 * never needs to name itself) and lastActivityAt, which a player-facing
 * DTO has no use for but an admin watching for stalled players during a
 * live event very much does.
 */
export interface AdminStoryProgressDTO {
  userId: string;
  username: string;
  status: StoryProgressStatus;
  currentChapterSlug: string | null;
  currentSceneSlug: string | null;
  completedSceneCount: number;
  startedAt: Date;
  lastActivityAt: Date;
  completedAt: Date | null;
}