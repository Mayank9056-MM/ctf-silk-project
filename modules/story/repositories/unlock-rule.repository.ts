import type { UnlockRule } from "@/app/generated/prisma/client";
import { UnlockTargetType, UnlockConditionType } from "@/app/generated/prisma/enums";
import type { DbClient } from "@/lib/prisma";

/**
 * Read-only repository for UnlockRule. Every method here is pure
 * retrieval — evaluating whether a rule's condition is actually satisfied
 * for a given player (checking SceneCompletion, ChoiceSelection,
 * ChallengeSolve, or Event access) is service-layer logic that reads
 * across multiple modules; this repository only ever answers "which
 * rules exist," never "are they met."
 */
class UnlockRuleRepository {
  /**
   * Every rule guarding a specific scene. Ordering by createdAt gives a
   * stable, deterministic iteration order for callers that evaluate rules
   * as an ordered list (e.g. short-circuiting on the first unmet
   * condition) without needing a dedicated `order` column on a table
   * that's authored far less frequently than Scene/Chapter itself.
   */
  async findRulesForScene(db: DbClient, sceneId: string): Promise<UnlockRule[]> {
    return db.unlockRule.findMany({
      where: { targetType: UnlockTargetType.SCENE, targetId: sceneId },
      orderBy: { createdAt: "asc" },
    });
  }

  async findRulesForChapter(db: DbClient, chapterId: string): Promise<UnlockRule[]> {
    return db.unlockRule.findMany({
      where: { targetType: UnlockTargetType.CHAPTER, targetId: chapterId },
      orderBy: { createdAt: "asc" },
    });
  }

  async findRulesForEvidence(db: DbClient, evidenceId: string): Promise<UnlockRule[]> {
    return db.unlockRule.findMany({
      where: { targetType: UnlockTargetType.EVIDENCE, targetId: evidenceId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * The general form findRulesForScene/Chapter/Evidence are thin wrappers
   * around — kept public rather than private since a future admin CMS
   * screen ("show me every rule targeting this content item") has the
   * targetType already in hand and shouldn't need to guess which of the
   * three specific methods to call.
   */
  async findRulesByTarget(
    db: DbClient,
    targetType: UnlockTargetType,
    targetId: string,
  ): Promise<UnlockRule[]> {
    return db.unlockRule.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Every rule of a given condition type, regardless of target — e.g.
   * "every rule that depends on Challenge X being solved," useful when a
   * future admin flow needs to know the blast radius of unpublishing or
   * deleting a specific challenge/chapter/choice before allowing it.
   * `referenceId` is optional here deliberately: some condition types
   * (EVENT_LIVE) have no reference to filter by at all.
   */
  async findRulesByCondition(
    db: DbClient,
    conditionType: UnlockConditionType,
    referenceId?: string,
  ): Promise<UnlockRule[]> {
    return db.unlockRule.findMany({
      where: {
        conditionType,
        ...(referenceId !== undefined ? { referenceId } : {}),
      },
      orderBy: { createdAt: "asc" },
    });
  }
}

export const unlockRuleRepository = new UnlockRuleRepository();