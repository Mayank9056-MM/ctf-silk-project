import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import prisma from "@/lib/prisma";

import { eventService } from "@/modules/event/services/event.service";
import { storyContentRepository } from "../repositories/story-content.repository";
import { storyProgressRepository } from "../repositories/story-progress.repository";
import { storyCache, storyCacheKeys } from "../cache/story.cache";
import { unlockService } from "./unlock.service";
import { sceneService } from "./scene.service";
import { storyNavigationService } from "./story-navigation.service";
import { toChapterMapDTO, toStoryProgressDTO } from "../utils/story.mapper";
import type { ChapterMapDTO } from "../types/chapter.dto";
import type { StoryHistoryDTO, StoryProgressDTO } from "../types/progress.dto";
import type { SceneDTO } from "../types/scene.dto";
import type { StoryStateDTO } from "../types/story.dto";
import { STORY_CONSTANTS } from "../constants/story.constants";

import { storyLogger as log } from "@/lib/logger/logger.scopes";
import * as auditService from "../../audit/services/audit.service";
import { AuditActorType } from "@/app/generated/prisma/enums";

/**
 * The top-level facade for everything storyNavigationService doesn't own
 * — the campaign map, a standalone progress summary, replaying completed
 * content, and restarting the story from scratch. Moment-to-moment
 * "what scene am I on, advance, choose" stays in storyNavigationService;
 * this file composes across it rather than duplicating its transition
 * logic.
 */
class StoryService {
  /**
   * The campaign map — every published chapter with its state relative
   * to this player. Only the player's CURRENT chapter is ever unlock-
   * checked: every chapter before it is COMPLETED by order comparison
   * alone, every chapter after it is LOCKED by default, so evaluating
   * unlock rules for chapters other than the current one would be pure
   * waste — the map's shape makes that unnecessary, not an optimization
   * bolted on afterward.
   *
   * Not gated on event-live — a player should be able to see the
   * campaign structure (locked nodes and all) whether the event hasn't
   * started yet or has already ended. This is a deliberate contrast with
   * storyNavigationService's write paths, which must gate on live event;
   * a read-only map view has no fairness/scoring consequence either way.
   */
  async getChapterMap(userId: string): Promise<ChapterMapDTO> {
    const [chapters, progress] = await Promise.all([
      storyCache.getOrSet(
        storyCacheKeys.publishedChapters(),
        () => storyContentRepository.findPublishedChapters(prisma),
        STORY_CONSTANTS.CHAPTER_MAP_CACHE_TTL_MS,
      ),
      storyProgressRepository.findProgress(prisma, userId),
    ]);

    const currentChapterId = progress?.currentChapterId ?? null;
    const currentChapterOrder = currentChapterId
      ? (chapters.find((chapter) => chapter.id === currentChapterId)?.order ??
        null)
      : null;

    const isCurrentChapterUnlocked = currentChapterId
      ? (await unlockService.evaluateChapterUnlock(userId, currentChapterId))
          .isUnlocked
      : false;

    return toChapterMapDTO(
      chapters,
      currentChapterId,
      currentChapterOrder,
      isCurrentChapterUnlocked,
    );
  }

  /**
   * A standalone progress summary — for a HUD element that needs "how
   * far am I" without rendering a full scene. Throws NOT_FOUND rather
   * than bootstrapping a fresh row: unlike getCurrentScene (which exists
   * specifically to hand a first-time player their entry scene), this
   * method's contract is "report existing progress," so a player who
   * hasn't started yet gets a clear "not started" signal, not a
   * side-effecting row creation triggered by what looks like a read.
   *
   * NOTE: this duplicates composition logic already inline in
   * storyNavigationService (chapter lookup + scene lookup +
   * countCompletedScenes → toStoryProgressDTO), not extracted into a
   * shared helper yet. Worth pulling into one place — a small utility
   * both services call — the next time either file changes; flagging it
   * rather than letting a fourth near-identical copy accumulate quietly.
   */
  async getStoryProgress(userId: string): Promise<StoryProgressDTO> {
    const progress = await storyProgressRepository.findProgress(prisma, userId);

    if (!progress) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Story progress not found.");
    }

    const [chapter, scene, completions] = await Promise.all([
      progress.currentChapterId
        ? storyContentRepository.findChapterById(
            prisma,
            progress.currentChapterId,
          )
        : null,
      progress.currentSceneId
        ? storyContentRepository.findSceneById(prisma, progress.currentSceneId)
        : null,
      storyProgressRepository.getCompletedScenes(prisma, userId),
    ]);

    return toStoryProgressDTO(
      progress,
      chapter?.slug ?? null,
      scene?.slug ?? null,
      completions.length,
    );
  }

  /**
   * A player's full completion history — "everywhere they've been," per
   * StoryHistoryDTO's own doc comment. Slug is deliberately NOT included
   * per-completion (SceneCompletionDTO carries sceneSlug per its type,
   * but resolving it here would mean a second batch lookup this feature
   * doesn't need yet — sceneSlug isn't consumed by anything calling this
   * method today). Wait — StoryProgressDTO uses slug elsewhere in this
   * module, but SceneCompletionDTO's actual fields are sceneSlug/
   * sceneTitle/completedAt; matching that exactly below.
   *
   * Batches the title lookup via the new findSceneTitlesByIds rather
   * than one findSceneById call per completion — same discipline
   * getEvidenceBoard already follows for its own N-item fan-out.
   *
   * Returns an empty history (not NOT_FOUND) for a player with no
   * completions yet — unlike getStoryProgress, "no history" is a
   * legitimate, displayable empty state here, not something to
   * distinguish from "never started" via a thrown error.
   */
  async getStoryHistory(userId: string): Promise<StoryHistoryDTO> {
    const completions = await storyProgressRepository.getCompletedScenes(
      prisma,
      userId,
    );

    if (completions.length === 0) {
      return { completions: [] };
    }

    const sceneIds = [...new Set(completions.map((c) => c.sceneId))];
    const scenes = await storyContentRepository.findSceneTitlesByIds(
      prisma,
      sceneIds,
    );
    const sceneById = new Map(scenes.map((s) => [s.id, s]));

    return {
      completions: completions.map((completion) => {
        const scene = sceneById.get(completion.sceneId);
        if (!scene) {
          log.warn("Completion references a scene that no longer exists", {
            userId,
            sceneId: completion.sceneId,
          });
        }
        return {
          sceneSlug: scene?.slug ?? null,
          sceneTitle: scene?.title ?? null,
          completedAt: completion.completedAt,
        };
      }),
    };
  }

  /**
   * Delegates straight to sceneService, which already enforces "only if
   * actually completed." No event-live gate here either — replaying
   * content a player has legitimately already seen has no bearing on
   * fairness, and being able to revisit the story after the event ends
   * is a feature, not a risk, unlike advancing/choosing which must stay
   * gated since those write progress-affecting state.
   */
  async replayScene(userId: string, sceneId: string): Promise<SceneDTO> {
    return sceneService.getSceneForReplay(userId, sceneId);
  }

  /**
   * Wipes SceneCompletion/ChoiceSelection/StoryProgress and re-bootstraps
   * a fresh run via storyNavigationService.getCurrentScene — the same
   * first-visit path a brand-new player takes, so "what a restarted
   * player's first scene looks like" is defined in exactly one place.
   *
   * Deliberately checks event access BEFORE the destructive reset, not
   * after. getCurrentScene() also asserts this internally, but calling
   * it only AFTER resetProgress() already ran would mean: event not
   * live → reset succeeds, rebuild throws → the player's progress is
   * gone with no fresh row created to replace it until they try again
   * later. Checking up front means this is all-or-nothing: either
   * nothing is touched, or the reset and rebuild both complete.
   *
   * Deliberately does NOT touch ChallengeSolve/Submission/
   * LeaderboardEntry — those are separate systems. A player restarting
   * their STORY playthrough can neither gain nor lose competitive
   * standing by doing so; only narrative/dialogue history resets.
   *
   * Open product question, not resolved here: should this be blocked
   * once the event is genuinely underway (mid-competition), to avoid a
   * player disrupting their own pacing at a bad moment, or is
   * self-service restart always fine since it can't affect scoring
   * either way? Implemented as always-available while the event is live;
   * revisit if that turns out to be the wrong default.
   */
  async restartStory(userId: string): Promise<StoryStateDTO> {
    const access = await eventService.getEventAccess(prisma);

    if (!access.canAccessGame) {
      log.debug("Story restart rejected — event not accessible", {
        userId,
        state: access.state,
        isPaused: access.isPaused,
      });

      const message = access.isPaused
        ? "The event is temporarily paused. Please try again shortly."
        : access.state === "EVENT_SOON"
          ? "The event hasn't started yet."
          : "The event has ended.";

      throw ApiError.forbidden(ErrorCode.FORBIDDEN, message);
    }

    await storyProgressRepository.resetProgress(prisma, userId);

    log.info("Story progress reset", { userId });

    await auditService.record(prisma, {
      eventKey: "STORY_RESTARTED",
      actor: {
        actorType: AuditActorType.USER,
        actorId: userId,
        actorUsername: null,
        actorRole: null,
      },
      resourceId: userId,
      success: true,
    });

    return storyNavigationService.getCurrentScene(userId);
  }
}

export const storyService = new StoryService();
