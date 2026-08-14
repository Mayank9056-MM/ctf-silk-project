import type {
  Chapter,
  Scene,
  Character,
  Choice,
  Evidence,
  Prisma,
} from "@/app/generated/prisma/client";
import { ContentStatus, SceneType } from "@/app/generated/prisma/enums";
import type { DbClient } from "@/lib/prisma";

/**
 * Narrow character shape embedded in dialogue reads — avoids pulling
 * `metadata` (voice/personality config with no reason to travel alongside
 * every dialogue line fetch) along for the ride.
 */
const characterSummarySelect = {
  id: true,
  slug: true,
  displayName: true,
  portraitUrl: true,
} as const satisfies Prisma.CharacterSelect;

const sceneWithDialogueArgs = {
  include: {
    dialogueLines: {
      orderBy: { order: "asc" },
      include: { character: { select: characterSummarySelect } },
    },
  },
} as const satisfies Prisma.SceneDefaultArgs;

export type SceneWithDialogue = Prisma.SceneGetPayload<
  typeof sceneWithDialogueArgs
>;

const chapterScenesSelect = {
  id: true,
  slug: true,
  title: true,
  type: true,
  order: true,
  status: true,
  challengeId: true,
  evidenceId: true,
} as const satisfies Prisma.SceneSelect;

export type ChapterSceneSummary = Prisma.SceneGetPayload<{
  select: typeof chapterScenesSelect;
}>;

const sceneMetadataSelect = {
  id: true,
  type: true,
  metadata: true,
} as const satisfies Prisma.SceneSelect;

export type SceneMetadata = Prisma.SceneGetPayload<{
  select: typeof sceneMetadataSelect;
}>;

/**
 * Read-only repository for authored story content — Chapter, Scene,
 * DialogueLine, Character, Choice, Evidence, and the Scene↔Challenge
 * relation. No business logic, no status enforcement beyond what a given
 * method's name promises: methods without "Published" in the name return
 * content regardless of DRAFT/PUBLISHED/ARCHIVED status and are shared by
 * both the player-facing path (wrapped by a service that applies its own
 * gating) and the admin/preview path; "findPublished*" methods filter to
 * PUBLISHED at the query level for the one-line, no-forgetting-the-filter
 * case.
 */
class StoryContentRepository {
  // ============================================================
  // Chapter
  // ============================================================

  /** All chapters with status = PUBLISHED, ordered by their campaign sequence. */
  async findPublishedChapters(db: DbClient): Promise<Chapter[]> {
    return db.chapter.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: { order: "asc" },
    });
  }

  async findChapterById(db: DbClient, id: string): Promise<Chapter | null> {
    return db.chapter.findUnique({ where: { id } });
  }

  async findChapterBySlug(db: DbClient, slug: string): Promise<Chapter | null> {
    return db.chapter.findUnique({ where: { slug } });
  }

  /**
   * Scene summaries for a chapter's overview (map/editor list) — select
   * only, deliberately no dialogueLines/choices included, since those are
   * only needed when actually rendering one specific scene, not listing
   * many.
   */
  async findChapterScenes(
    db: DbClient,
    chapterId: string,
  ): Promise<ChapterSceneSummary[]> {
    return db.scene.findMany({
      where: { chapterId },
      select: chapterScenesSelect,
      orderBy: { order: "asc" },
    });
  }

  // ============================================================
  // Scene
  // ============================================================

  async findSceneById(db: DbClient, id: string): Promise<Scene | null> {
    return db.scene.findUnique({ where: { id } });
  }

  async findSceneTitlesByIds(
    db: DbClient,
    sceneIds: string[],
  ): Promise<{ id: string; slug: string; title: string | null }[]> {
    if (sceneIds.length === 0) return [];
    return db.scene.findMany({
      where: { id: { in: sceneIds } },
      select: { id: true, slug: true, title: true },
    });
  }

  /** Scene's composite unique key is (chapterId, slug) — both required. */
  async findSceneBySlug(
    db: DbClient,
    chapterId: string,
    slug: string,
  ): Promise<Scene | null> {
    return db.scene.findUnique({
      where: { chapterId_slug: { chapterId, slug } },
    });
  }

  /** The lowest-order scene in a chapter — the entry point when a player first reaches it. */
  async findFirstSceneOfChapter(
    db: DbClient,
    chapterId: string,
  ): Promise<Scene | null> {
    return db.scene.findFirst({
      where: { chapterId },
      orderBy: { order: "asc" },
    });
  }

  /**
   * The next scene in linear order after `currentOrder` within a chapter.
   * A DB-level primitive only — whether the caller uses this or resolves
   * via a Choice's `nextSceneId` instead (branching) is a service-layer
   * decision, not this repository's concern.
   */
  async findNextScene(
    db: DbClient,
    chapterId: string,
    currentOrder: number,
  ): Promise<Scene | null> {
    return db.scene.findFirst({
      where: { chapterId, order: { gt: currentOrder } },
      orderBy: { order: "asc" },
    });
  }

  /**
   * A scene with its dialogue lines (ordered) and each line's speaking
   * character, in one query — the include below is what keeps this to a
   * single round trip instead of N+1 per dialogue line.
   */
  async findSceneWithDialogue(
    db: DbClient,
    sceneId: string,
  ): Promise<SceneWithDialogue | null> {
    return db.scene.findUnique({
      where: { id: sceneId },
      ...sceneWithDialogueArgs,
    });
  }

  /** A scene filtered to status = PUBLISHED — the player-facing single-scene lookup. */
  async findPublishedScene(
    db: DbClient,
    sceneId: string,
  ): Promise<Scene | null> {
    return db.scene.findFirst({
      where: { id: sceneId, status: ContentStatus.PUBLISHED },
    });
  }

  /** Just type + metadata — for a cutscene renderer that needs its JSON config and nothing else. */
  async findSceneMetadata(
    db: DbClient,
    sceneId: string,
  ): Promise<SceneMetadata | null> {
    return db.scene.findUnique({
      where: { id: sceneId },
      select: sceneMetadataSelect,
    });
  }

  /** The CHALLENGE_GATE scene that a given challenge satisfies, if any. */
  async findChallengeScene(
    db: DbClient,
    challengeId: string,
  ): Promise<Scene | null> {
    return db.scene.findFirst({
      where: { challengeId, type: SceneType.CHALLENGE_GATE },
    });
  }

  // ============================================================
  // Choice
  // ============================================================

  /**
   * Ordered choices for a scene. Returns the full row, including
   * `nextSceneId` — hiding that from players is a DTO/mapper concern,
   * not something this repository decides.
   */
  async findSceneChoices(db: DbClient, sceneId: string): Promise<Choice[]> {
    return db.choice.findMany({
      where: { sceneId },
      orderBy: { order: "asc" },
    });
  }

  // ============================================================
  // Character
  // ============================================================

  async findCharacter(
    db: DbClient,
    characterId: string,
  ): Promise<Character | null> {
    return db.character.findUnique({ where: { id: characterId } });
  }

  // ============================================================
  // Evidence
  // ============================================================

  async findEvidence(
    db: DbClient,
    evidenceId: string,
  ): Promise<Evidence | null> {
    return db.evidence.findUnique({ where: { id: evidenceId } });
  }

  /** Evidence filtered to status = PUBLISHED — the player-facing evidence-board lookup. */
  async findPublishedEvidence(
    db: DbClient,
    evidenceId: string,
  ): Promise<Evidence | null> {
    return db.evidence.findFirst({
      where: { id: evidenceId, status: ContentStatus.PUBLISHED },
    });
  }

  /**
   * The EVIDENCE_REVEAL scenes for one chapter, batched — the "which
   * scene reveals which evidence" lookup for an ENTIRE chapter in one
   * query, not one query per evidence item. Deliberately narrow select:
   * the board only ever needs id + evidenceId from these rows.
   */
  async findEvidenceRevealScenesForChapter(
    db: DbClient,
    chapterId: string,
  ): Promise<{ id: string; evidenceId: string }[]> {
    const scenes = await db.scene.findMany({
      where: {
        chapterId,
        type: SceneType.EVIDENCE_REVEAL,
        status: ContentStatus.PUBLISHED,
        evidenceId: { not: null },
      },
      select: { id: true, evidenceId: true },
    });
    // evidenceId is guaranteed non-null by the where clause; narrow the type.
    return scenes.map((s) => ({
      id: s.id,
      evidenceId: s.evidenceId as string,
    }));
  }

  /** Published Evidence rows for a batch of ids — one query for the whole board, not one per item. */
  async findPublishedEvidenceByIds(
    db: DbClient,
    evidenceIds: string[],
  ): Promise<Evidence[]> {
    if (evidenceIds.length === 0) return [];
    return db.evidence.findMany({
      where: { id: { in: evidenceIds }, status: ContentStatus.PUBLISHED },
    });
  }
}

export const storyContentRepository = new StoryContentRepository();
