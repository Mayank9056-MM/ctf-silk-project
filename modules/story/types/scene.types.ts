import type { Chapter, Choice, Scene } from "@/app/generated/prisma/client";
import type { SceneWithDialogue } from "../repositories/story-content.repository";

/**
 * A scene composed with its choices, on top of what
 * storyContentRepository.findSceneWithDialogue already provides (which
 * only includes dialogueLines). Choices are fetched separately via
 * findSceneChoices — combining the two into one shape here is what lets
 * the service assemble a full SceneDTO from two small, targeted queries
 * instead of one large include with fields most callers don't need.
 */
export interface ResolvedScene {
  scene: SceneWithDialogue;
  choices: Choice[];
}

/**
 * Internal result of checking one scene against a player's actual
 * progress/unlock state — computed fresh on every request, never stored
 * (same discipline as EventAccess/ChapterProgressState). `unmetReason` is
 * for admin/debug logging only; it names which UnlockRule condition
 * failed, which would spoil upcoming branch structure if it ever reached
 * a player-facing DTO.
 */
export interface SceneAccessResult {
  scene: Scene;
  isUnlocked: boolean;
  isCompleted: boolean;
  unmetReason: string | null;
}

/**
 * Why scene-resolver.ts landed on a given next scene — CHOICE and LINEAR
 * are mutually exclusive resolution paths (a scene either ends in a
 * choice the player picked, or falls through to the next scene in
 * chapter order), while the CHAPTER_/STORY_COMPLETE reasons mean there
 * was no next scene to resolve to at all.
 */
export type SceneAdvanceReason = "LINEAR" | "CHOICE" | "CHAPTER_COMPLETE" | "STORY_COMPLETE";

/**
 * `nextChapter` is set only when the resolution actually crosses a
 * chapter boundary (the last scene of one chapter resolving into the
 * first scene of the next) — staying within the same chapter leaves it
 * null so callers can tell "moved to a new chapter" apart from "same
 * chapter, next scene" without a second lookup.
 */
export interface SceneResolution {
  nextScene: Scene | null;
  nextChapter: Chapter | null;
  reason: SceneAdvanceReason;
}