import { Prisma, type Scene, type Chapter, type Choice } from "@/app/generated/prisma/client";
import { StoryProgressStatus } from "@/app/generated/prisma/enums";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import prisma from "@/lib/prisma";
import type { DbClient } from "@/lib/prisma";

import { eventService } from "@/modules/event/services/event.service";
import { storyContentRepository } from "../repositories/story-content.repository";
import { storyProgressRepository } from "../repositories/story-progress.repository";
import { unlockService } from "./unlock.service";
import { sceneService } from "./scene.service";
import { resolveNextScene } from "../utils/scene-resolver";
import type { SceneResolution } from "../types/scene.types";
import { toStoryProgressDTO, toStoryStateDTO } from "../utils/story.mapper";
import type { StoryStateDTO } from "../types/story.dto";

/**
 * Owns moment-to-moment story progression — "what scene is this player
 * on, and how do they move to the next one." Delegates rather than
 * duplicates: sceneService assembles the actual SceneDTO once a
 * destination is known; resolveNextScene walks the graph; unlockService
 * decides whether a resolved destination is actually allowed.
 *
 * REQUIRED interface from unlock.service.ts (not yet built as of this
 * file — written against this exact contract so the two compile
 * together the moment it lands, rather than retrofitting call sites):
 *   evaluateSceneUnlock(userId, sceneId): Promise<UnlockEvaluationResult>
 *   evaluateChapterUnlock(userId, chapterId): Promise<UnlockEvaluationResult>
 *
 * Confirms the CHALLENGE_GATE design decision from the domain doc: this
 * file has no special case for SceneType.CHALLENGE_GATE anywhere. The
 * gating "you can't proceed until this challenge is solved" lives
 * entirely as an UnlockRule (targetType: SCENE, conditionType:
 * CHALLENGE_SOLVED) on whatever scene comes AFTER the gate — the general
 * mechanism does the specific job without this service knowing anything
 * about challenges directly.
 */
class StoryNavigationService {
  /**
   * The player's current position — bootstraps a fresh StoryProgress row
   * on first visit.
   */
  async getCurrentScene(userId: string): Promise<StoryStateDTO> {
    await this.assertEventIsLive();

    const progress = await this.getOrCreateProgress(userId);

    if (progress.status === StoryProgressStatus.COMPLETED) {
      return this.buildCompletedState(userId, progress.currentChapterId);
    }

    if (!progress.currentSceneId || !progress.currentChapterId) {
      // Defensive — getOrCreateProgress always sets both together;
      // this only fires if something outside this service (a future
      // admin tool, a manual DB edit) left the row inconsistent.
      throw ApiError.internal("Story progress is in an inconsistent state.");
    }

    const [scene, chapter] = await Promise.all([
      sceneService.getScene(userId, progress.currentSceneId),
      this.requireChapter(progress.currentChapterId),
    ]);

    return toStoryStateDTO(
      chapter,
      scene,
      toStoryProgressDTO(progress, chapter.slug, scene.slug, await this.countCompletedScenes(userId)),
    );
  }

  /**
   * Linear advance — no choice involved. Rejects outright if the
   * player's current scene actually has choices attached, so a client
   * can never bypass a branch decision by calling the wrong endpoint.
   */
  async advanceScene(userId: string, currentSceneId: string): Promise<StoryStateDTO> {
    await this.assertEventIsLive();

    const { scene: currentScene, choices } = await this.requireCurrentScene(userId, currentSceneId);

    if (choices.length > 0) {
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "This scene requires a choice — use select-choice instead.",
      );
    }

    const resolution = await this.safeResolve(currentScene, null);
    return this.applyTransition(userId, currentScene, resolution, null);
  }

  /**
   * Branching advance — validates the choice actually belongs to the
   * player's current scene before resolving anything, so a stale
   * choiceId from an old response can't be replayed against a scene
   * the player has since moved past.
   */
  async selectChoice(userId: string, currentSceneId: string, choiceId: string): Promise<StoryStateDTO> {
    await this.assertEventIsLive();

    const { scene: currentScene, choices } = await this.requireCurrentScene(userId, currentSceneId);
    const choice = choices.find((candidate) => candidate.id === choiceId);

    if (!choice) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Choice not found for this scene.");
    }

    const resolution = await this.safeResolve(currentScene, choice);
    return this.applyTransition(userId, currentScene, resolution, choice.id);
  }

  // ============================================================
  // Internal
  // ============================================================

  private async assertEventIsLive(): Promise<void> {
    const access = await eventService.getEventAccess(prisma);

    if (!access.canAccessGame) {
      throw ApiError.forbidden(
        ErrorCode.FORBIDDEN,
        access.state === "EVENT_SOON" ? "The event hasn't started yet." : "The event has ended.",
      );
    }
  }

  private async getOrCreateProgress(userId: string) {
    const existing = await storyProgressRepository.findProgress(prisma, userId);
    if (existing) return existing;

    const [firstChapter] = await storyContentRepository.findPublishedChapters(prisma);

    if (!firstChapter) {
      throw ApiError.internal("No published chapters exist yet.");
    }

    const entryScene = await storyContentRepository.findFirstSceneOfChapter(prisma, firstChapter.id);

    if (!entryScene) {
      throw ApiError.internal(`Chapter ${firstChapter.slug} has no scenes.`);
    }

    return storyProgressRepository.createProgress(prisma, {
      user: { connect: { id: userId } },
      currentChapter: { connect: { id: firstChapter.id } },
      currentScene: { connect: { id: entryScene.id } },
    });
  }

  /**
   * Confirms `currentSceneId` (client-supplied) matches this player's
   * REAL current position before doing anything else — the check that
   * prevents advancing/choosing against a scene already moved past,
   * whether from stale UI state, a replayed request, or a deliberate
   * attempt to skip ahead.
   */
  private async requireCurrentScene(
    userId: string,
    currentSceneId: string,
  ): Promise<{ scene: Scene; choices: Choice[] }> {
    const progress = await storyProgressRepository.findProgress(prisma, userId);

    if (!progress || progress.currentSceneId !== currentSceneId) {
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "This isn't your current scene. Refresh and try again.",
      );
    }

    const [scene, choices] = await Promise.all([
      storyContentRepository.findSceneById(prisma, currentSceneId),
      storyContentRepository.findSceneChoices(prisma, currentSceneId),
    ]);

    if (!scene) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Scene not found.");
    }

    return { scene, choices };
  }

  /**
   * Wraps resolveNextScene per its own documented contract: a thrown
   * plain Error is an authoring-integrity problem, never something to
   * surface verbatim to a player.
   */
  private async safeResolve(currentScene: Scene, choice: Choice | null): Promise<SceneResolution> {
    try {
      return await resolveNextScene(prisma, currentScene, choice);
    } catch (error) {
      console.error("[storyNavigationService] scene resolution failed:", error);
      throw ApiError.internal("This part of the story isn't available right now.");
    }
  }

  private async applyTransition(
    userId: string,
    currentScene: Scene,
    resolution: SceneResolution,
    choiceId: string | null,
  ): Promise<StoryStateDTO> {
    if (resolution.reason === "STORY_COMPLETE") {
      await prisma.$transaction(async (tx) => {
        await this.recordChoiceIfPresent(tx, userId, currentScene.id, choiceId);
        await this.completeSceneIfNeeded(tx, userId, currentScene.id);
        await storyProgressRepository.completeStory(tx, userId);
      });

      return this.buildCompletedState(userId, currentScene.chapterId);
    }

    if (!resolution.nextScene) {
      throw ApiError.internal("Scene resolution returned no next scene without indicating story completion.");
    }
    const nextScene = resolution.nextScene;

    const sceneUnlock = await unlockService.evaluateSceneUnlock(userId, nextScene.id);
    if (!sceneUnlock.isUnlocked) {
      throw ApiError.forbidden(ErrorCode.FORBIDDEN, "That part of the story isn't unlocked yet.");
    }

    if (resolution.nextChapter) {
      const chapterUnlock = await unlockService.evaluateChapterUnlock(userId, resolution.nextChapter.id);
      if (!chapterUnlock.isUnlocked) {
        throw ApiError.forbidden(ErrorCode.FORBIDDEN, "The next chapter isn't unlocked yet.");
      }
    }

    await prisma.$transaction(async (tx) => {
      await this.recordChoiceIfPresent(tx, userId, currentScene.id, choiceId);
      await this.completeSceneIfNeeded(tx, userId, currentScene.id);
      await storyProgressRepository.updateCurrentScene(tx, userId, nextScene.id);
      if (resolution.nextChapter) {
        await storyProgressRepository.updateCurrentChapter(tx, userId, resolution.nextChapter.id);
      }
    });

    const chapter = resolution.nextChapter ?? (await this.requireChapter(currentScene.chapterId));
    const [scene, progress] = await Promise.all([
      sceneService.getScene(userId, nextScene.id),
      storyProgressRepository.findProgress(prisma, userId),
    ]);

    if (!progress) {
      throw ApiError.internal("Story progress vanished mid-transition.");
    }

    return toStoryStateDTO(
      chapter,
      scene,
      toStoryProgressDTO(progress, chapter.slug, scene.slug, await this.countCompletedScenes(userId)),
    );
  }

  /**
   * Handles the race where two concurrent requests both pass
   * requireCurrentScene's check before either commits (a double-click,
   * two open tabs). The composite PK on ChoiceSelection is (userId,
   * sceneId) — NOT (userId, choiceId) — so if the loser is racing on a
   * DIFFERENT choice than whichever request won, silently swallowing the
   * P2002 would let the loser's caller believe ITS choice was recorded
   * when a different one actually was. Verifying the existing row
   * before treating this as a harmless no-op is what closes that gap.
   */
  private async recordChoiceIfPresent(
    tx: DbClient,
    userId: string,
    sceneId: string,
    choiceId: string | null,
  ): Promise<void> {
    if (!choiceId) return;

    try {
      await storyProgressRepository.saveChoice(tx, userId, sceneId, choiceId);
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) throw error;

      const existing = await storyProgressRepository.findChoice(tx, userId, sceneId);
      if (existing?.choiceId !== choiceId) {
        throw ApiError.conflict(
          ErrorCode.VALIDATION_ERROR,
          "A different choice was already recorded for this scene.",
        );
      }
    }
  }

  /**
   * SceneCompletion has no equivalent ambiguity — a P2002 here
   * unambiguously means "already completed," nothing further to verify.
   */
  private async completeSceneIfNeeded(tx: DbClient, userId: string, sceneId: string): Promise<void> {
    try {
      await storyProgressRepository.completeScene(tx, userId, sceneId);
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) throw error;
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }

  private async requireChapter(chapterId: string): Promise<Chapter> {
    const chapter = await storyContentRepository.findChapterById(prisma, chapterId);
    if (!chapter) {
      throw ApiError.internal(`Chapter ${chapterId} referenced by progress no longer exists.`);
    }
    return chapter;
  }

  private async countCompletedScenes(userId: string): Promise<number> {
    const completions = await storyProgressRepository.getCompletedScenes(prisma, userId);
    return completions.length;
  }

  private async buildCompletedState(userId: string, lastChapterId: string | null): Promise<StoryStateDTO> {
    if (!lastChapterId) {
      throw ApiError.internal("Completed story progress has no chapter reference.");
    }

    const [chapter, progress] = await Promise.all([
      this.requireChapter(lastChapterId),
      storyProgressRepository.findProgress(prisma, userId),
    ]);

    if (!progress) {
      throw ApiError.internal("Story progress vanished after completion.");
    }

    return toStoryStateDTO(
      chapter,
      null,
      toStoryProgressDTO(progress, chapter.slug, null, await this.countCompletedScenes(userId)),
    );
  }
}

export const storyNavigationService = new StoryNavigationService();