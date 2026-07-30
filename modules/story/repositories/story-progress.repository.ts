import type {
  StoryProgress,
  SceneCompletion,
  ChoiceSelection,
  Prisma,
} from "@/app/generated/prisma/client";
import { StoryProgressStatus } from "@/app/generated/prisma/enums";
import type { DbClient } from "@/lib/prisma";

/**
 * Stores and retrieves per-player story progression — StoryProgress (one
 * row per user, "where are they now"), SceneCompletion (full history,
 * "everywhere they've been"), and ChoiceSelection ("what they picked").
 *
 * Transaction note: every method here takes `db: DbClient`, which may be
 * the global `prisma` client OR a `Prisma.TransactionClient` an outer
 * service call is already running inside — `Prisma.TransactionClient` has
 * no `$transaction` method of its own, so no method in this file opens
 * its own transaction. Where a method modifies more than one table
 * (`resetProgress`), atomicity across those writes is the CALLER's
 * responsibility: wrap the call in `prisma.$transaction(async (tx) => ...)`
 * and pass `tx` as `db` when that guarantee is needed. This mirrors the
 * same convention already established for submissionRepository and
 * leaderboardRepository.upsertForSolve.
 */
class StoryProgressRepository {
  // ============================================================
  // StoryProgress
  // ============================================================

  async findProgress(
    db: DbClient,
    userId: string,
  ): Promise<StoryProgress | null> {
    return db.storyProgress.findUnique({ where: { userId } });
  }

  /**
   * Creates the initial progress row. Which chapter/scene a player starts
   * at is resolved by the service (it depends on published-content state,
   * not something this repository decides) — passed in as a full
   * CreateInput rather than assumed here.
   */
  async createProgress(
    db: DbClient,
    data: Prisma.StoryProgressCreateInput,
  ): Promise<StoryProgress> {
    return db.storyProgress.create({ data });
  }

  /**
   * Moves the player's current-scene pointer. Does not touch
   * currentChapterId — call updateCurrentChapter separately if the new
   * scene belongs to a different chapter; keeping these independent
   * means a scene-to-scene advance within the same chapter is a single,
   * minimal write.
   */
  async updateCurrentScene(
    db: DbClient,
    userId: string,
    sceneId: string,
  ): Promise<StoryProgress> {
    return db.storyProgress.update({
      where: { userId },
      data: { currentSceneId: sceneId },
    });
  }

  async updateCurrentChapter(
    db: DbClient,
    userId: string,
    chapterId: string,
  ): Promise<StoryProgress> {
    return db.storyProgress.update({
      where: { userId },
      data: { currentChapterId: chapterId },
    });
  }

  async completeStory(db: DbClient, userId: string): Promise<StoryProgress> {
    return db.storyProgress.update({
      where: { userId },
      data: { status: StoryProgressStatus.COMPLETED, completedAt: new Date() },
    });
  }

  /**
   * Bumps lastActivityAt with no other field change — for a heartbeat/
   * "still here" signal on a scene with no natural progress event (e.g.
   * an idle cutscene). An empty `data` object is enough: `lastActivityAt`
   * is `@updatedAt`, so Prisma sets it on every update() call regardless
   * of what else is in the payload.
   */
  async touchLastActivity(
    db: DbClient,
    userId: string,
  ): Promise<StoryProgress> {
    return db.storyProgress.update({ where: { userId }, data: {} });
  }

  /**
   * Wipes a player's entire story history — SceneCompletion,
   * ChoiceSelection, and the StoryProgress row itself. Three deletes, not
   * wrapped in this repository's own transaction (see the class-level
   * note); the caller supplies `tx` if it needs this to be all-or-nothing.
   * A subsequent createProgress call re-establishes a fresh row.
   */
  async resetProgress(db: DbClient, userId: string): Promise<void> {
    await db.choiceSelection.deleteMany({ where: { userId } });
    await db.sceneCompletion.deleteMany({ where: { userId } });
    await db.storyProgress.deleteMany({ where: { userId } });
  }

  // ============================================================
  // SceneCompletion
  // ============================================================

  /**
   * Records a scene as completed. No upsert, no existence check first —
   * the composite primary key (userId, sceneId) is what makes a
   * duplicate completion impossible; a repeat call surfaces as a Prisma
   * P2002 error, which bubbles to the caller rather than being swallowed
   * here (per the "no custom domain errors" constraint). The caller
   * decides what a duplicate means (idempotent no-op vs. a real error).
   */
  async completeScene(
    db: DbClient,
    userId: string,
    sceneId: string,
  ): Promise<SceneCompletion> {
    return db.sceneCompletion.create({ data: { userId, sceneId } });
  }

  async hasCompletedScene(
    db: DbClient,
    userId: string,
    sceneId: string,
  ): Promise<boolean> {
    const completion = await db.sceneCompletion.findUnique({
      where: { userId_sceneId: { userId, sceneId } },
      select: { userId: true },
    });
    return completion != null;
  }

  /** Full completion history, oldest first — the raw data behind a progress/analytics view. */
  async getCompletedScenes(
    db: DbClient,
    userId: string,
  ): Promise<SceneCompletion[]> {
    return db.sceneCompletion.findMany({
      where: { userId },
      orderBy: { completedAt: "asc" },
    });
  }

  // ============================================================
  // ChoiceSelection
  // ============================================================

  /**
   * Records which choice a player picked for a scene. Same reasoning as
   * completeScene: no upsert. The composite PK is (userId, sceneId) —
   * NOT (userId, choiceId) — so a second, different choice for the same
   * scene fails at the database level rather than silently overwriting
   * the first one.
   */
  async saveChoice(
    db: DbClient,
    userId: string,
    sceneId: string,
    choiceId: string,
  ): Promise<ChoiceSelection> {
    return db.choiceSelection.create({ data: { userId, sceneId, choiceId } });
  }

  async findChoice(
    db: DbClient,
    userId: string,
    sceneId: string,
  ): Promise<ChoiceSelection | null> {
    return db.choiceSelection.findUnique({
      where: { userId_sceneId: { userId, sceneId } },
    });
  }

  /**
   * Whether a user has ever selected a specific choice, by choiceId rather
   * than sceneId — needed for CHOICE_SELECTED unlock rules, which
   * reference a choice directly without knowing which scene it belonged
   * to. Distinct from findChoice(userId, sceneId), which answers "what did
   * this user pick for this scene"; this answers "did they ever pick THIS
   * specific choice."
   */
  async existsChoiceSelectionByChoiceId(
    db: DbClient,
    userId: string,
    choiceId: string,
  ): Promise<boolean> {
    const selection = await db.choiceSelection.findFirst({
      where: { userId, choiceId },
      select: { userId: true },
    });
    return selection != null;
  }
}

export const storyProgressRepository = new StoryProgressRepository();
