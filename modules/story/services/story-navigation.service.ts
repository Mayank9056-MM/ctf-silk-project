import {
  Prisma,
  type Scene,
  type Chapter,
  type Choice,
} from "@/app/generated/prisma/client";
import { StoryProgressStatus, SceneType } from "@/app/generated/prisma/enums";
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

import { storyLogger as log } from "@/lib/logger/logger.scopes";

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
    await this.assertEventIsLive(userId);

    const progress = await this.getOrCreateProgress(userId);

    if (progress.status === StoryProgressStatus.COMPLETED) {
      return this.buildCompletedState(userId, progress.currentChapterId);
    }

    if (!progress.currentSceneId || !progress.currentChapterId) {
      // Defensive — getOrCreateProgress always sets both together;
      // this only fires if something outside this service (a future
      // admin tool, a manual DB edit) left the row inconsistent.
      log.error(
        "Story progress row is inconsistent — missing scene or chapter reference",
        undefined,
        { userId, progressId: progress.userId },
      );
      throw ApiError.internal("Story progress is in an inconsistent state.");
    }

    const [scene, chapter] = await Promise.all([
      sceneService.getScene(userId, progress.currentSceneId),
      this.requireChapter(progress.currentChapterId),
    ]);

    return toStoryStateDTO(
      chapter,
      scene,
      toStoryProgressDTO(
        progress,
        chapter.slug,
        scene.slug,
        await this.countCompletedScenes(userId),
      ),
    );
  }

  /**
   * Linear advance — no choice involved. Rejects outright if the
   * player's current scene actually has choices attached, so a client
   * can never bypass a branch decision by calling the wrong endpoint.
   */
  async advanceScene(
    userId: string,
    currentSceneId: string,
  ): Promise<StoryStateDTO> {
    await this.assertEventIsLive(userId);

    const { scene: currentScene, choices } = await this.requireCurrentScene(
      userId,
      currentSceneId,
    );

    if (choices.length > 0) {
      log.debug("Advance rejected — scene requires a choice", {
        userId,
        sceneId: currentSceneId,
      });

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
  async selectChoice(
    userId: string,
    currentSceneId: string,
    choiceId: string,
  ): Promise<StoryStateDTO> {
    await this.assertEventIsLive(userId);

    const { scene: currentScene, choices } = await this.requireCurrentScene(
      userId,
      currentSceneId,
    );
    const choice = choices.find((candidate) => candidate.id === choiceId);

    if (!choice) {
      log.debug("Select-choice rejected — choice not found for scene", {
        userId,
        sceneId: currentSceneId,
        choiceId,
      });
      throw ApiError.notFound(
        ErrorCode.NOT_FOUND,
        "Choice not found for this scene.",
      );
    }

    const resolution = await this.safeResolve(currentScene, choice);
    return this.applyTransition(userId, currentScene, resolution, choice.id);
  }

  /**
   * Called by SubmissionService immediately after a correct flag
   * submission is durably recorded — the fix for the "same
   * CHALLENGE_GATE keeps reappearing" bug. Re-reads StoryProgress
   * itself; takes NO sceneId/chapterId/challengeId-derived shortcut
   * from the caller beyond the already-authorized challengeId. Advances
   * the gate ONLY if the player's CURRENT scene really is the
   * CHALLENGE_GATE for this exact challenge — everything else is a
   * safe, logged no-op, never a thrown error, because by the time this
   * runs SubmissionService's transaction has already committed the
   * ChallengeSolve. A story-navigation mismatch here must never look
   * like — or cause — a failed submission.
   *
   * Idempotent by construction, which is what makes this safe to call
   * on every correct submission (including alreadySolved resubmissions,
   * not just the first solve): it always re-reads the CURRENT
   * StoryProgress, so if the gate already advanced (this player's
   * current scene is no longer this CHALLENGE_GATE), the type/challengeId
   * check below simply fails closed and this returns null without
   * attempting a second transition. That's also the self-heal path if
   * an earlier call to this method failed for any reason — the next
   * correct submission (or even a duplicate-solve resubmission) will
   * retry it from a fresh read.
   *
   * Deliberately mirrors ChallengeAccessService's own proof
   * (currentScene.type === CHALLENGE_GATE AND
   * currentScene.challengeId === challengeId) rather than trusting that
   * SubmissionService already checked it moments ago — story state can
   * change between requests, and this method has no way to know how
   * long ago that check ran.
   */
  async advanceAfterChallengeSolved(
    userId: string,
    challengeId: string,
  ): Promise<StoryStateDTO | null> {
    const progress = await storyProgressRepository.findProgress(prisma, userId);

    if (!progress || !progress.currentSceneId) {
      log.debug(
        "Post-solve advance skipped — player has no story progress yet",
        { userId, challengeId },
      );
      return null;
    }

    const [currentScene, choices] = await Promise.all([
      storyContentRepository.findSceneById(prisma, progress.currentSceneId),
      storyContentRepository.findSceneChoices(prisma, progress.currentSceneId),
    ]);

    if (!currentScene) {
      log.error(
        "Story progress points at a missing scene during post-solve advance",
        undefined,
        { userId, challengeId, sceneId: progress.currentSceneId },
      );
      return null;
    }

    if (currentScene.type !== SceneType.CHALLENGE_GATE) {
      log.debug(
        "Post-solve advance skipped — player's current scene is not a challenge gate",
        { userId, challengeId, sceneId: currentScene.id },
      );
      return null;
    }

    if (currentScene.challengeId !== challengeId) {
      log.debug(
        "Post-solve advance skipped — solved challenge does not match the player's current gate",
        {
          userId,
          challengeId,
          sceneId: currentScene.id,
          gateChallengeId: currentScene.challengeId,
        },
      );
      return null;
    }

    if (choices.length > 0) {
      // Defensive — per this file's own confirmed CHALLENGE_GATE design
      // decision (see class doc), a challenge gate should never carry
      // authored choices; the unlock condition lives on the scene
      // AFTER the gate, not on the gate itself. If content authoring
      // ever violates that, fail safe rather than silently picking a
      // branch on the player's behalf.
      log.error(
        "CHALLENGE_GATE scene unexpectedly has choices — refusing to auto-advance",
        undefined,
        { userId, challengeId, sceneId: currentScene.id },
      );
      return null;
    }

    const resolution = await this.safeResolve(currentScene, null);
    return this.applyTransition(userId, currentScene, resolution, null);
  }

  // ============================================================
  // Internal
  // ============================================================

  private async assertEventIsLive(userId: string): Promise<void> {
    const access = await eventService.getEventAccess(prisma);

    if (!access.canAccessGame) {
      log.debug("Story navigation rejected — event not accessible", {
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
  }

  private async getOrCreateProgress(userId: string) {
    const existing = await storyProgressRepository.findProgress(prisma, userId);
    if (existing) return existing;

    const [firstChapter] =
      await storyContentRepository.findPublishedChapters(prisma);

    if (!firstChapter) {
      log.error(
        "No published chapters exist — cannot bootstrap story progress",
        undefined,
        {
          userId,
        },
      );

      throw ApiError.internal("No published chapters exist yet.");
    }

    const entryScene = await storyContentRepository.findFirstSceneOfChapter(
      prisma,
      firstChapter.id,
    );

    if (!entryScene) {
      log.error(
        "First published chapter has no scenes — cannot bootstrap story progress",
        undefined,
        {
          userId,
          chapterId: firstChapter.id,
        },
      );
      throw ApiError.internal(`Chapter ${firstChapter.slug} has no scenes.`);
    }

    const created = storyProgressRepository.createProgress(prisma, {
      user: { connect: { id: userId } },
      currentChapter: { connect: { id: firstChapter.id } },
      currentScene: { connect: { id: entryScene.id } },
    });

    log.info("Story progress bootstrapped for new player", {
      userId,
      chapterId: firstChapter.id,
      sceneId: entryScene.id,
    });

    return created;
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
      log.debug(
        "Scene mismatch — client's currentSceneId doesn't match progress",
        {
          userId,
          claimedSceneId: currentSceneId,
        },
      );

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
      log.error("Player's current scene has no content", undefined, {
        userId,
        sceneId: currentSceneId,
      });

      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Scene not found.");
    }

    return { scene, choices };
  }

  /**
   * Wraps resolveNextScene per its own documented contract: a thrown
   * plain Error is an authoring-integrity problem, never something to
   * surface verbatim to a player.
   */
  private async safeResolve(
    currentScene: Scene,
    choice: Choice | null,
  ): Promise<SceneResolution> {
    try {
      return await resolveNextScene(prisma, currentScene, choice);
    } catch (error) {
      log.error("Scene resolution failed — content-integrity problem", error, {
        sceneId: currentScene.id,
        choiceId: choice?.id ?? null,
      });
      throw ApiError.internal(
        "This part of the story isn't available right now.",
      );
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

      log.info("Story completed", { userId });

      return this.buildCompletedState(userId, currentScene.chapterId);
    }

    if (!resolution.nextScene) {
      log.error(
        "Scene resolution returned no next scene without indicating story completion",
        undefined,
        { userId, sceneId: currentScene.id },
      );

      throw ApiError.internal(
        "Scene resolution returned no next scene without indicating story completion.",
      );
    }
    const nextScene = resolution.nextScene;

    const sceneUnlock = await unlockService.evaluateSceneUnlock(
      userId,
      nextScene.id,
    );
    if (!sceneUnlock.isUnlocked) {
      log.debug("Scene transition blocked — target scene not unlocked", {
        userId,
        sceneId: nextScene.id,
      });

      throw ApiError.forbidden(
        ErrorCode.FORBIDDEN,
        "That part of the story isn't unlocked yet.",
      );
    }

    if (resolution.nextChapter) {
      const chapterUnlock = await unlockService.evaluateChapterUnlock(
        userId,
        resolution.nextChapter.id,
      );
      if (!chapterUnlock.isUnlocked) {
        log.debug("Chapter transition blocked — target chapter not unlocked", {
          userId,
          chapterId: resolution.nextChapter.id,
        });

        throw ApiError.forbidden(
          ErrorCode.FORBIDDEN,
          "The next chapter isn't unlocked yet.",
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await this.recordChoiceIfPresent(tx, userId, currentScene.id, choiceId);
      await this.completeSceneIfNeeded(tx, userId, currentScene.id);
      await storyProgressRepository.updateCurrentScene(
        tx,
        userId,
        nextScene.id,
      );
      if (resolution.nextChapter) {
        await storyProgressRepository.updateCurrentChapter(
          tx,
          userId,
          resolution.nextChapter.id,
        );
      }
    });

    const chapter =
      resolution.nextChapter ??
      (await this.requireChapter(currentScene.chapterId));
    const [scene, progress] = await Promise.all([
      sceneService.getScene(userId, nextScene.id),
      storyProgressRepository.findProgress(prisma, userId),
    ]);

    if (!progress) {
      log.error("Story progress vanished mid-transition", undefined, {
        userId,
        sceneId: nextScene.id,
      });
      throw ApiError.internal("Story progress vanished mid-transition.");
    }

    return toStoryStateDTO(
      chapter,
      scene,
      toStoryProgressDTO(
        progress,
        chapter.slug,
        scene.slug,
        await this.countCompletedScenes(userId),
      ),
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

      const existing = await storyProgressRepository.findChoice(
        tx,
        userId,
        sceneId,
      );
      if (existing?.choiceId !== choiceId) {
        log.warn("Concurrent choice selection race detected", {
          userId,
          sceneId,
          attemptedChoiceId: choiceId,
          recordedChoiceId: existing?.choiceId ?? null,
        });

        throw ApiError.conflict(
          ErrorCode.VALIDATION_ERROR,
          "A different choice was already recorded for this scene.",
        );
      }

      log.debug("Duplicate choice selection — already recorded, no-op", {
        userId,
        sceneId,
        choiceId,
      });
    }
  }

  /**
   * SceneCompletion has no equivalent ambiguity — a P2002 here
   * unambiguously means "already completed," nothing further to verify.
   */
  private async completeSceneIfNeeded(
    tx: DbClient,
    userId: string,
    sceneId: string,
  ): Promise<void> {
    try {
      await storyProgressRepository.completeScene(tx, userId, sceneId);
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) throw error;
      log.debug("Duplicate scene completion — already recorded, no-op", {
        userId,
        sceneId,
      });
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }

  private async requireChapter(chapterId: string): Promise<Chapter> {
    const chapter = await storyContentRepository.findChapterById(
      prisma,
      chapterId,
    );
    if (!chapter) {
      log.error("Chapter referenced by progress no longer exists", undefined, {
        chapterId,
      });
      throw ApiError.internal(
        `Chapter ${chapterId} referenced by progress no longer exists.`,
      );
    }
    return chapter;
  }

  private async countCompletedScenes(userId: string): Promise<number> {
    const completions = await storyProgressRepository.getCompletedScenes(
      prisma,
      userId,
    );
    return completions.length;
  }

  private async buildCompletedState(
    userId: string,
    lastChapterId: string | null,
  ): Promise<StoryStateDTO> {
    if (!lastChapterId) {
      throw ApiError.internal(
        "Completed story progress has no chapter reference.",
      );
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
      toStoryProgressDTO(
        progress,
        chapter.slug,
        null,
        await this.countCompletedScenes(userId),
      ),
    );
  }
}

export const storyNavigationService = new StoryNavigationService();
