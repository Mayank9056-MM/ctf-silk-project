// modules/challenge/services/challenge-access.service.ts

import prisma from "@/lib/prisma";
import { ContentStatus, SceneType } from "@/app/generated/prisma/enums";

import { eventService } from "@/modules/event/services/event.service";
import { storyProgressRepository } from "@/modules/story/repositories/story-progress.repository";
import { storyContentRepository } from "@/modules/story/repositories/story-content.repository";
import { submissionRepository } from "@/modules/submission/repositories/submission.repository";

import { challengeRepository } from "../repositories/challenge.repository";

import { challengeLogger as log } from "@/lib/logger/logger.scopes";

/**
 * Server-side-only reasons a challenge access check failed. NEVER surface
 * this value (or anything derived from it) in a player-facing response —
 * see the class doc below. Callers collapse every non-null deniedReason
 * to the same generic NOT_FOUND.
 */
export type ChallengeAccessDeniedReason =
  | "EVENT_NOT_ACCESSIBLE"
  | "CHALLENGE_NOT_FOUND"
  | "NO_STORY_PROGRESS"
  | "CURRENT_SCENE_MISSING"
  | "CURRENT_SCENE_NOT_PUBLISHED"
  | "CURRENT_SCENE_NOT_CHALLENGE_GATE"
  | "CHALLENGE_NOT_CURRENT"
  | "PREREQUISITE_NOT_MET";

/**
 * The outcome of evaluating whether `userId` may access/attempt
 * `challengeId` RIGHT NOW. Deliberately just an authorization verdict —
 * NOT whether the player has already solved it. "Already solved" was
 * removed from this result: it cost an extra query on every single GET
 * request, and duplicate-solve/duplicate-XP prevention is already fully
 * owned by SubmissionService + the ChallengeSolve composite primary key
 * (see submission.service.ts's isDuplicateSolve/P2002 handling). This
 * service answers exactly one question — "can they access/attempt it
 * right now" — and nothing about solve history.
 */
export interface ChallengeAccessResult {
  readonly isAuthorized: boolean;
  /** Log-only. Never expose to a player-facing response. */
  readonly deniedReason: ChallengeAccessDeniedReason | null;
}

function denied(reason: ChallengeAccessDeniedReason): ChallengeAccessResult {
  return { isAuthorized: false, deniedReason: reason };
}

/**
 * Determines whether a specific authenticated player may access/attempt
 * a specific challenge at this moment. Pure authorization — no flag
 * verification, no XP, no story mutation, no rendering. Composes
 * existing repositories/services rather than introducing a second source
 * of truth for any of their data.
 *
 * The core proof (per the domain design doc) is:
 *
 *     StoryProgress.currentSceneId === scene.id
 *         AND
 *     scene.challengeId === challengeId
 *
 * `progress.currentSceneId` is read fresh from the database on every
 * call. This service takes NO sceneId/chapterId parameter — a caller
 * cannot pass one in as a shortcut even by mistake.
 *
 * Challenge→Scene is one-to-many in the schema (`Challenge.scenes:
 * Scene[]`), so this only ever asks "does THIS player's CURRENT scene
 * reference this challenge" — correct regardless of how many other
 * scenes also reference the same challenge.
 *
 * Query shape: two round trips, not N. The first batch
 * (event access / challenge+prerequisites / story progress) is fully
 * independent and runs via Promise.all; the second batch (current-scene
 * lookup / prerequisite-solve lookup) is also independent of each other
 * and runs in parallel — the solve lookup is skipped entirely when the
 * challenge has no prerequisites.
 */
class ChallengeAccessService {
  async evaluateChallengeAccess(
    userId: string,
    challengeId: string,
  ): Promise<ChallengeAccessResult> {
    const [eventAccess, challenge, progress] = await Promise.all([
      eventService.getEventAccess(prisma),
      challengeRepository.findWithPrerequisites(challengeId),
      storyProgressRepository.findProgress(prisma, userId),
    ]);

    if (!eventAccess.canAccessGame) {
      log.debug("Challenge access denied — event not accessible", {
        userId,
        challengeId,
        state: eventAccess.state,
        isPaused: eventAccess.isPaused,
      });
      return denied("EVENT_NOT_ACCESSIBLE");
    }

    if (!challenge) {
      log.warn("Challenge access denied — challenge does not exist", {
        userId,
        challengeId,
      });
      return denied("CHALLENGE_NOT_FOUND");
    }

    if (!progress || !progress.currentSceneId) {
      log.debug("Challenge access denied — no story progress yet", {
        userId,
        challengeId,
      });
      return denied("NO_STORY_PROGRESS");
    }

    const hasPrerequisites = challenge.prerequisites.length > 0;

    const [currentScene, solvedChallengeIds] = await Promise.all([
      storyContentRepository.findSceneById(prisma, progress.currentSceneId),
      hasPrerequisites
        ? submissionRepository
            .findSolvesByUser(prisma, userId)
            .then((solves) => new Set(solves.map((s) => s.challengeId)))
        : Promise.resolve(new Set<string>()),
    ]);

    if (!currentScene) {
      log.error(
        "Challenge access check found a StoryProgress pointing at a missing scene",
        undefined,
        { userId, challengeId, sceneId: progress.currentSceneId },
      );
      return denied("CURRENT_SCENE_MISSING");
    }

    if (currentScene.status !== ContentStatus.PUBLISHED) {
      log.error(
        "Challenge access check found the player's current scene is not published",
        undefined,
        {
          userId,
          challengeId,
          sceneId: currentScene.id,
          status: currentScene.status,
        },
      );
      return denied("CURRENT_SCENE_NOT_PUBLISHED");
    }

    if (currentScene.type !== SceneType.CHALLENGE_GATE) {
      log.debug(
        "Challenge access denied — player's current scene is not a challenge gate",
        { userId, challengeId, sceneId: currentScene.id },
      );
      return denied("CURRENT_SCENE_NOT_CHALLENGE_GATE");
    }

    if (currentScene.challengeId !== challengeId) {
      log.debug(
        "Challenge access denied — requested challenge does not match player's current scene",
        {
          userId,
          challengeId,
          sceneId: currentScene.id,
          currentSceneChallengeId: currentScene.challengeId,
        },
      );
      return denied("CHALLENGE_NOT_CURRENT");
    }

    if (hasPrerequisites) {
      const unmet = challenge.prerequisites
        .map((p) => p.prerequisiteId)
        .filter((id) => !solvedChallengeIds.has(id));
      if (unmet.length > 0) {
        log.debug("Challenge access denied — unmet prerequisites", {
          userId,
          challengeId,
          unmetPrerequisiteIds: unmet,
        });
        return denied("PREREQUISITE_NOT_MET");
      }
    }

    return { isAuthorized: true, deniedReason: null };
  }
}

export const challengeAccessService = new ChallengeAccessService();