import prisma from "@/lib/prisma";
import {
  UnlockConditionType,
  StoryProgressStatus,
} from "@/app/generated/prisma/enums";
import type { UnlockRule } from "@/app/generated/prisma/client";

import { eventService } from "@/modules/event/services/event.service";
import { submissionRepository } from "@/modules/submission/repositories/submission.repository";

import { unlockRuleRepository } from "../repositories/unlock-rule.repository";
import { storyContentRepository } from "../repositories/story-content.repository";
import { storyProgressRepository } from "../repositories/story-progress.repository";
import type { UnlockEvaluationResult } from "../types/story.types";

import { storyLogger as log } from "@/lib/logger/logger.scopes";

/**
 * Evaluates UnlockRules — the general gating mechanism from the domain
 * design doc. Combination logic across multiple rules on one target is
 * AND (every rule must be met), matching ChallengePrerequisite's own
 * "every listed prerequisite required" semantics — not settled
 * explicitly in the domain doc, so recording the decision here: if
 * OR-groups are ever needed (unlock via EITHER challenge X OR challenge
 * Y), that's a `UnlockRuleGroup` concept layered on top later, not a
 * change to this evaluation loop.
 *
 * Every condition-type branch fails CLOSED on any integrity problem
 * (missing referenceId, a referenceId pointing at something that no
 * longer exists) — an authoring mistake should never accidentally
 * unlock content early; it should log loudly and keep it locked.
 */
class UnlockService {
  async evaluateSceneUnlock(
    userId: string,
    sceneId: string,
  ): Promise<UnlockEvaluationResult> {
    const rules = await unlockRuleRepository.findRulesForScene(prisma, sceneId);
    return this.evaluateRules(userId, rules);
  }

  async evaluateChapterUnlock(
    userId: string,
    chapterId: string,
  ): Promise<UnlockEvaluationResult> {
    const rules = await unlockRuleRepository.findRulesForChapter(
      prisma,
      chapterId,
    );
    return this.evaluateRules(userId, rules);
  }

  async evaluateEvidenceUnlock(
    userId: string,
    evidenceId: string,
  ): Promise<UnlockEvaluationResult> {
    const rules = await unlockRuleRepository.findRulesForEvidence(
      prisma,
      evidenceId,
    );
    return this.evaluateRules(userId, rules);
  }

  private async evaluateRules(
    userId: string,
    rules: UnlockRule[],
  ): Promise<UnlockEvaluationResult> {
    if (rules.length === 0) {
      return { isUnlocked: true, unmetRuleIds: [] };
    }

    const results = await Promise.all(
      rules.map(async (rule) => ({
        rule,
        met: await this.evaluateCondition(userId, rule),
      })),
    );

    const unmetRuleIds = results
      .filter((result) => !result.met)
      .map((result) => result.rule.id);

    return { isUnlocked: unmetRuleIds.length === 0, unmetRuleIds };
  }

  private async evaluateCondition(
    userId: string,
    rule: UnlockRule,
  ): Promise<boolean> {
    switch (rule.conditionType) {
      case UnlockConditionType.CHALLENGE_SOLVED:
        return this.isChallengeSolved(userId,rule.id, rule.referenceId);
      case UnlockConditionType.CHAPTER_COMPLETED:
        return this.isChapterCompleted(userId,rule.id, rule.referenceId);
      case UnlockConditionType.SCENE_COMPLETED:
        return this.isSceneCompleted(userId,rule.id, rule.referenceId);
      case UnlockConditionType.CHOICE_SELECTED:
        return this.isChoiceSelected(userId,rule.id, rule.referenceId);
      case UnlockConditionType.EVENT_LIVE:
        return this.isEventLive();
      default:
        // Exhaustiveness guard — a new UnlockConditionType added without
        // a matching branch above fails to compile here, not silently
        // at runtime.
        return this.assertUnreachable(rule.conditionType);
    }
  }

  private async isChallengeSolved(
    userId: string,
    ruleId: string,
    referenceId: string | null,
  ): Promise<boolean> {
    if (!referenceId)
      return this.failClosed("CHALLENGE_SOLVED rule missing referenceId", {
    ruleId,userId});
    return submissionRepository.existsSolveByUserAndChallenge(
      prisma,
      userId,
      referenceId,
    );
  }

  private async isSceneCompleted(
    userId: string,
    ruleId: string,
    referenceId: string | null,
  ): Promise<boolean> {
    if (!referenceId)
      return this.failClosed("SCENE_COMPLETED rule missing referenceId",{
    ruleId, userId});
    return storyProgressRepository.hasCompletedScene(
      prisma,
      userId,
      referenceId,
    );
  }

  /**
   * "Completed" means the player has moved to a LATER chapter, or
   * finished the story outright — not "visited every scene in it,"
   * since chapter progression in this design is already linear
   * (branching happens within a chapter via Choice, not across chapter
   * boundaries independent of order). Reuses the same order-comparison
   * story.mapper.ts uses for the campaign map, rather than a second,
   * different definition of "chapter done."
   */
  private async isChapterCompleted(
    userId: string,
    ruleId: string,
    referenceId: string | null,
  ): Promise<boolean> {
    if (!referenceId)
      return this.failClosed("CHAPTER_COMPLETED rule missing referenceId", {
        ruleId,
        userId,
      });

    const progress = await storyProgressRepository.findProgress(prisma, userId);
    if (!progress) return false;
    if (progress.status === StoryProgressStatus.COMPLETED) return true;
    if (!progress.currentChapterId) return false;

    const [targetChapter, currentChapter] = await Promise.all([
      storyContentRepository.findChapterById(prisma, referenceId),
      storyContentRepository.findChapterById(prisma, progress.currentChapterId),
    ]);

    if (!targetChapter || !currentChapter) {
      return this.failClosed(
        `CHAPTER_COMPLETED references a missing chapter (${referenceId})`,
        {
          ruleId,
          userId,
          referenceId,
        },
      );
    }

    return currentChapter.order > targetChapter.order;
  }

  private async isChoiceSelected(
    userId: string,
    ruleId: string,
    referenceId: string | null,
  ): Promise<boolean> {
    if (!referenceId)
      return this.failClosed("CHOICE_SELECTED rule missing referenceId", {
        ruleId,
        userId,
      });
    return storyProgressRepository.existsChoiceSelectionByChoiceId(
      prisma,
      userId,
      referenceId,
    );
  }

  private async isEventLive(): Promise<boolean> {
    const access = await eventService.getEventAccess(prisma);
    return access.canAccessGame;
  }

  private failClosed(
    message: string,
    context: Record<string, unknown>,
  ): boolean {
    log.error(
      "Unlock rule integrity problem — failing closed (locked)",
      undefined,
      { reason: message, ...context },
    );
    return false;
  }

  private assertUnreachable(value: never): never {
    log.error("Unhandled UnlockConditionType reached at runtime", undefined, {
      conditionType: String(value),
    });
    throw new Error(`Unhandled UnlockConditionType: ${value}`);
  }
}

export const unlockService = new UnlockService();
