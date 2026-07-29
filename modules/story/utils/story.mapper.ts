import type { Chapter, StoryProgress } from "@/app/generated/prisma/client";
import { StoryProgressStatus } from "@/app/generated/prisma/enums";
import { ChapterProgressState } from "../types/chapter.dto";
import type { ChapterDTO, ChapterMapEntryDTO, ChapterMapDTO } from "../types/chapter.dto";
import type { SceneDTO } from "../types/scene.dto";
import type { StoryProgressDTO } from "../types/progress.dto";
import type { StoryStateDTO } from "../types/story.dto";

export function toChapterDTO(chapter: Chapter): ChapterDTO {
  return { id: chapter.id, slug: chapter.slug, title: chapter.title, order: chapter.order };
}

/**
 * Computes a chapter's state relative to one player — never a stored
 * value, always derived from where they currently are. Per the decision
 * from chapter.dto.ts: a chapter is only ACTIVE if it's both the
 * player's current pointer AND every UnlockRule targeting it currently
 * evaluates true; otherwise it renders LOCKED even for the player's own
 * "current" chapter, which is the more honest state to show someone
 * staring at a pre-event countdown.
 */
export function toChapterMapEntryDTO(
  chapter: Chapter,
  progress: StoryProgress | null,
  isCurrentChapterUnlocked: boolean,
): ChapterMapEntryDTO {
  const isCurrent = progress?.currentChapterId === chapter.id;
  const isPast = progress !== null && chapter.order < (getCurrentChapterOrder(progress) ?? Infinity);

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
 * Building ChapterMapEntryDTO for every chapter needs each chapter's own
 * order to compare against — pulled from the already-fetched `chapters`
 * list rather than a second query, since the caller already has every
 * chapter in hand by the time it's assembling a full map.
 */
function getCurrentChapterOrder(progress: StoryProgress): number | null {
  return (progress as unknown as { currentChapter?: Chapter }).currentChapter?.order ?? null;
}

export function toChapterMapDTO(
  chapters: Chapter[],
  progress: StoryProgress | null,
  currentChapterUnlockStatus: Map<string, boolean>,
): ChapterMapDTO {
  return {
    chapters: chapters.map((chapter) =>
      toChapterMapEntryDTO(chapter, progress, currentChapterUnlockStatus.get(chapter.id) ?? false),
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