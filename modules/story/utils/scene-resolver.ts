import type { Chapter, Choice, Scene } from "@/app/generated/prisma/client";
import { ContentStatus } from "@/app/generated/prisma/enums";
import type { DbClient } from "@/lib/prisma";
import { storyContentRepository } from "../repositories/story-content.repository";
import type { SceneResolution } from "../types/scene.types";

/**
 * Computes what happens after a player leaves `currentScene` — either via
 * linear progression (no choice) or by selecting one of the scene's
 * choices. This is where the story graph is actually walked; every other
 * file in this module treats "what comes next" as something to call this
 * function for, not something to compute inline.
 *
 * Precondition this function relies on and does NOT itself verify:
 * whether a choice was REQUIRED for this scene (a scene with authored
 * Choice rows where a bare "advance" isn't valid) is the caller's
 * responsibility — story-navigation.service.ts already loads the scene's
 * choices to build its SceneDTO response, so re-checking here would be a
 * redundant query for a validation the caller is already positioned to
 * do for free. This function only answers "given that resolution is
 * valid, where does it lead."
 *
 * Throws a plain Error (not ApiError) on any content-integrity problem —
 * a choice with no destination on a published scene, a chapter with no
 * scenes, a dangling reference. These represent authoring bugs in the
 * story graph, not user-facing failures; the calling service is
 * responsible for catching and translating into ApiError.internal() with
 * a generic player-facing message, while the thrown message here stays
 * detailed enough for server logs/admin diagnosis.
 */
export async function resolveNextScene(
  db: DbClient,
  currentScene: Scene,
  selectedChoice?: Choice | null,
): Promise<SceneResolution> {
  if (selectedChoice) {
    return resolveViaChoice(db, currentScene, selectedChoice);
  }
  return resolveLinear(db, currentScene);
}

async function resolveViaChoice(
  db: DbClient,
  currentScene: Scene,
  choice: Choice,
): Promise<SceneResolution> {
  if (choice.sceneId !== currentScene.id) {
    throw new Error(
      `resolveNextScene: choice ${choice.id} belongs to scene ${choice.sceneId}, not the current scene ${currentScene.id}.`,
    );
  }

  if (!choice.nextSceneId) {
    throw new Error(
      `resolveNextScene: choice ${choice.id} on scene ${currentScene.id} has no destination — a published scene must never have an unresolved choice.`,
    );
  }

  const destinationScene = await storyContentRepository.findSceneById(db, choice.nextSceneId);
  assertResolvable(destinationScene, `choice ${choice.id}'s destination (${choice.nextSceneId})`);
  assertPublished(destinationScene, `choice ${choice.id}'s destination`);

  const crossesChapter = destinationScene.chapterId !== currentScene.chapterId;
  const nextChapter = crossesChapter
    ? await storyContentRepository.findChapterById(db, destinationScene.chapterId)
    : null;

  if (crossesChapter) {
    assertResolvable(nextChapter, `chapter ${destinationScene.chapterId} referenced by choice ${choice.id}`);
  }

  return { nextScene: destinationScene, nextChapter, reason: "CHOICE" };
}

async function resolveLinear(db: DbClient, currentScene: Scene): Promise<SceneResolution> {
  const nextSceneInChapter = await storyContentRepository.findNextScene(
    db,
    currentScene.chapterId,
    currentScene.order,
  );

  if (nextSceneInChapter) {
    assertPublished(nextSceneInChapter, "linear next scene");
    return { nextScene: nextSceneInChapter, nextChapter: null, reason: "LINEAR" };
  }

  // No more scenes in the current chapter — find whichever published
  // chapter comes next in campaign order. Fetching every published
  // chapter and filtering in memory (rather than a dedicated "next
  // chapter after X" repository query) is deliberate: this project has
  // on the order of half a dozen chapters total, so the extra rows cost
  // nothing, and it avoids adding a repository method whose only caller
  // would ever be this one function.
  const currentChapter = await storyContentRepository.findChapterById(db, currentScene.chapterId);
  assertResolvable(currentChapter, `chapter ${currentScene.chapterId} for scene ${currentScene.id}`);

  const publishedChapters = await storyContentRepository.findPublishedChapters(db);
  const nextChapter =
    publishedChapters
      .filter((chapter) => chapter.order > currentChapter.order)
      .sort((a, b) => a.order - b.order)[0] ?? null;

  if (!nextChapter) {
    // Last scene of the last chapter — the story genuinely ends here.
    return { nextScene: null, nextChapter: null, reason: "STORY_COMPLETE" };
  }

  const entryScene = await storyContentRepository.findFirstSceneOfChapter(db, nextChapter.id);
  assertResolvable(entryScene, `entry scene of chapter ${nextChapter.id} (${nextChapter.slug})`);
  assertPublished(entryScene, `entry scene of chapter ${nextChapter.slug}`);

  return { nextScene: entryScene, nextChapter, reason: "CHAPTER_COMPLETE" };
}

/** Narrows a possibly-null lookup result, throwing a diagnostic error if it's missing. */
function assertResolvable<T>(value: T | null, description: string): asserts value is T {
  if (value === null) {
    throw new Error(`resolveNextScene: could not resolve ${description} — dangling or missing reference.`);
  }
}

/** Guards against resolving into content that exists in the DB but was never published. */
function assertPublished(scene: Scene, context: string): void {
  if (scene.status !== ContentStatus.PUBLISHED) {
    throw new Error(
      `resolveNextScene: resolved ${context} (scene ${scene.id}) is not published (status: ${scene.status}).`,
    );
  }
}