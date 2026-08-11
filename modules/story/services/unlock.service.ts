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
import { STORY_CONSTANTS } from "../constants/story.constants";
import { storyCache, storyCacheKeys } from "../cache/story.cache";

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

  /**
   * Bulk evidence-unlock evaluation for an entire chapter's worth of
   * evidence in one call. NOT a second unlock engine — same UnlockRule
   * table, same AND-across-rules / fail-closed semantics as
   * evaluateEvidenceUnlock — just evaluated against preloaded per-player
   * fact sets instead of one query per condition per item. Exists
   * specifically because getEvidenceBoard() fans out to N evidence
   * items per request across 2,000+ concurrent players; the single-item
   * evaluateEvidenceUnlock() stays exactly as-is for getEvidence(),
   * where one request only ever needs one item.
   */
  async evaluateEvidenceAccessForChapter(
    userId: string,
    evidenceIds: string[],
  ): Promise<Map<string, UnlockEvaluationResult>> {
    const results = new Map<string, UnlockEvaluationResult>();
    if (evidenceIds.length === 0) return results;

    const rules = await unlockRuleRepository.findRulesForEvidenceIds(
      prisma,
      evidenceIds,
    );

    if (rules.length === 0) {
      for (const id of evidenceIds)
        results.set(id, { isUnlocked: true, unmetRuleIds: [] });
      return results;
    }

    const rulesByEvidence = new Map<string, UnlockRule[]>();
    for (const rule of rules) {
      const list = rulesByEvidence.get(rule.targetId) ?? [];
      list.push(rule);
      rulesByEvidence.set(rule.targetId, list);
    }

    const conditionTypes = new Set(rules.map((r) => r.conditionType));

    // Preload only what the PRESENT condition types actually need — a
    // chapter whose evidence rules are all SCENE_COMPLETED never touches
    // submissionRepository at all.
    const [
      solvedChallengeIds,
      completedScenes,
      selectedChoiceIds,
      progress,
      chapters,
      eventIsLive,
    ] = await Promise.all([
      conditionTypes.has(UnlockConditionType.CHALLENGE_SOLVED)
        ? submissionRepository
            .findSolvesByUser(prisma, userId)
            .then((solves) => solves.map((s) => s.challengeId))
        : Promise.resolve<string[]>([]),

      conditionTypes.has(UnlockConditionType.SCENE_COMPLETED)
        ? storyProgressRepository.getCompletedScenes(prisma, userId)
        : Promise.resolve([]),

      conditionTypes.has(UnlockConditionType.CHOICE_SELECTED)
        ? storyProgressRepository.getSelectedChoiceIds(prisma, userId)
        : Promise.resolve<string[]>([]),

      conditionTypes.has(UnlockConditionType.CHAPTER_COMPLETED)
        ? storyProgressRepository.findProgress(prisma, userId)
        : Promise.resolve(null),

      conditionTypes.has(UnlockConditionType.CHAPTER_COMPLETED)
        ? storyCache.getOrSet(
            storyCacheKeys.publishedChapters(),
            () => storyContentRepository.findPublishedChapters(prisma),
            STORY_CONSTANTS.CHAPTER_MAP_CACHE_TTL_MS,
          )
        : Promise.resolve([]),
      conditionTypes.has(UnlockConditionType.EVENT_LIVE)
        ? this.isEventLive()
        : Promise.resolve(true),
    ]);

    const solvedChallengeIdSet = new Set(solvedChallengeIds);
    const completedSceneIdSet = new Set(completedScenes.map((c) => c.sceneId));
    const selectedChoiceIdSet = new Set(selectedChoiceIds);
    const chapterOrderById = new Map(chapters.map((c) => [c.id, c.order]));
    const currentChapterOrder = progress?.currentChapterId
      ? (chapterOrderById.get(progress.currentChapterId) ?? null)
      : null;
    const isStoryCompleted = progress?.status === StoryProgressStatus.COMPLETED;

    const evaluate = (rule: UnlockRule): boolean => {
      switch (rule.conditionType) {
        case UnlockConditionType.CHALLENGE_SOLVED:
          if (!rule.referenceId)
            return this.failClosed(
              "CHALLENGE_SOLVED rule missing referenceId",
              { ruleId: rule.id, userId },
            );
          return solvedChallengeIdSet.has(rule.referenceId);
        case UnlockConditionType.SCENE_COMPLETED:
          if (!rule.referenceId)
            return this.failClosed("SCENE_COMPLETED rule missing referenceId", {
              ruleId: rule.id,
              userId,
            });
          return completedSceneIdSet.has(rule.referenceId);
        case UnlockConditionType.CHOICE_SELECTED:
          if (!rule.referenceId)
            return this.failClosed("CHOICE_SELECTED rule missing referenceId", {
              ruleId: rule.id,
              userId,
            });
          return selectedChoiceIdSet.has(rule.referenceId);
        case UnlockConditionType.CHAPTER_COMPLETED: {
          if (!rule.referenceId)
            return this.failClosed(
              "CHAPTER_COMPLETED rule missing referenceId",
              { ruleId: rule.id, userId },
            );
          if (isStoryCompleted) return true;
          if (currentChapterOrder === null) return false;
          const targetOrder = chapterOrderById.get(rule.referenceId);
          if (targetOrder === undefined)
            return this.failClosed(
              `CHAPTER_COMPLETED references a missing chapter (${rule.referenceId})`,
              {
                ruleId: rule.id,
                userId,
              },
            );
          return currentChapterOrder > targetOrder;
        }
        case UnlockConditionType.EVENT_LIVE:
          return eventIsLive;
        default:
          return this.assertUnreachable(rule.conditionType);
      }
    };

    for (const evidenceId of evidenceIds) {
      const evidenceRules = rulesByEvidence.get(evidenceId) ?? [];
      if (evidenceRules.length === 0) {
        results.set(evidenceId, { isUnlocked: true, unmetRuleIds: [] });
        continue;
      }
      const unmetRuleIds = evidenceRules
        .filter((r) => !evaluate(r))
        .map((r) => r.id);
      results.set(evidenceId, {
        isUnlocked: unmetRuleIds.length === 0,
        unmetRuleIds,
      });
    }

    return results;
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
        return this.isChallengeSolved(userId, rule.id, rule.referenceId);
      case UnlockConditionType.CHAPTER_COMPLETED:
        return this.isChapterCompleted(userId, rule.id, rule.referenceId);
      case UnlockConditionType.SCENE_COMPLETED:
        return this.isSceneCompleted(userId, rule.id, rule.referenceId);
      case UnlockConditionType.CHOICE_SELECTED:
        return this.isChoiceSelected(userId, rule.id, rule.referenceId);
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
        ruleId,
        userId,
      });
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
      return this.failClosed("SCENE_COMPLETED rule missing referenceId", {
        ruleId,
        userId,
      });
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
