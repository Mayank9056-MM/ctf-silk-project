import type { Chapter, StoryProgress } from "@/app/generated/prisma/client";
import { ChapterProgressState } from "../types/chapter.dto";
import type {
  ChapterDTO,
  ChapterMapEntryDTO,
  ChapterMapDTO,
} from "../types/chapter.dto";
import type { SceneDTO } from "../types/scene.dto";
import type { StoryProgressDTO } from "../types/progress.dto";
import type { StoryStateDTO } from "../types/story.dto";

export function toChapterDTO(chapter: Chapter): ChapterDTO {
  return {
    id: chapter.id,
    slug: chapter.slug,
    title: chapter.title,
    order: chapter.order,
  };
}

/**
 * Computes a chapter's state relative to one player — never a stored
 * value, always derived from where they currently are. A chapter is
 * only ACTIVE if it's both the player's current pointer AND every
 * UnlockRule targeting it currently evaluates true; otherwise it renders
 * LOCKED even for the player's own "current" chapter — the honest state
 * to show someone staring at a pre-event countdown.
 *
 * currentChapterOrder is the CURRENT chapter's own order, passed in by
 * the caller (already known from the already-fetched chapters list) —
 * not derived here via any relation access, since StoryProgress carries
 * no included relations by default.
 */
export function toChapterMapEntryDTO(
  chapter: Chapter,
  currentChapterId: string | null,
  currentChapterOrder: number | null,
  isCurrentChapterUnlocked: boolean,
): ChapterMapEntryDTO {
  const isCurrent = currentChapterId === chapter.id;
  const isPast =
    currentChapterOrder !== null && chapter.order < currentChapterOrder;

  let state: ChapterProgressState;
  if (isCurrent && isCurrentChapterUnlocked) {
    state = ChapterProgressState.ACTIVE;
  } else if (isPast) {
    state = ChapterProgressState.COMPLETED;
  } else {
    state = ChapterProgressState.LOCKED;
  }

  return { ...toChapterDTO(chapter), state };
}

/**
 * Only the CURRENT chapter's unlock status is ever needed — every
 * chapter before it is COMPLETED by the order comparison alone, every
 * chapter after it is LOCKED by default, since progress can only point
 * at one chapter at a time. A single boolean covers every chapter in
 * the list; no per-chapter Map required.
 */
export function toChapterMapDTO(
  chapters: Chapter[],
  currentChapterId: string | null,
  currentChapterOrder: number | null,
  isCurrentChapterUnlocked: boolean,
): ChapterMapDTO {
  return {
    chapters: chapters.map((chapter) =>
      toChapterMapEntryDTO(
        chapter,
        currentChapterId,
        currentChapterOrder,
        isCurrentChapterUnlocked,
      ),
    ),
  };
}

export function toStoryProgressDTO(
  progress: StoryProgress,
  currentChapterSlug: string | null,
  currentSceneSlug: string | null,
  completedSceneCount: number,
): StoryProgressDTO {
  return {
    status: progress.status,
    currentChapterSlug,
    currentSceneSlug,
    completedSceneCount,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
  };
}

export function toStoryStateDTO(
  chapter: Chapter,
  scene: SceneDTO | null,
  progress: StoryProgressDTO,
): StoryStateDTO {
  return { chapter: toChapterDTO(chapter), scene, progress };
}
