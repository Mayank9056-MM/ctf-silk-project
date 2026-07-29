/**
 * Whether the story is currently playable at all, for a given player —
 * one layer above per-scene access. Combines Event access (is the event
 * even live) with whether the player has started/finished. Computed
 * fresh per request, same "derive, don't cache" discipline as
 * EventAccess — never stored on StoryProgress itself.
 */
export type StoryAccessState =
  | "EVENT_NOT_LIVE"
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED";

export interface StoryAccess {
  state: StoryAccessState;
  canPlay: boolean;
}

/**
 * Result of evaluating every UnlockRule targeting one Chapter/Scene/
 * Evidence for one player. `unmetRuleIds` — not human-readable
 * descriptions — deliberately: this is consumed by internal service
 * logic and admin tooling, never mapped into a player-facing DTO, which
 * is exactly why it's safe to expose rule internals here that
 * SceneDTO/ChapterMapEntryDTO never do.
 */
export interface UnlockEvaluationResult {
  isUnlocked: boolean;
  unmetRuleIds: string[];
}

/**
 * One edge in the authored choice graph — a scene and where each of its
 * choices leads. `nextSceneId` stays nullable here, mirroring Choice's
 * own schema nullability (an admin can author a choice before its
 * destination exists).
 */
export interface StoryGraphNode {
  sceneId: string;
  chapterId: string;
  choiceEdges: { choiceId: string; nextSceneId: string | null }[];
}

/**
 * The full authored story as a graph — built for admin-side validation
 * tooling (detecting cycles, dangling choices with a null destination on
 * an otherwise-published scene, orphaned scenes no chapter/choice points
 * at). Per the domain design doc: cycle/integrity checks on this graph
 * are a service-layer concern, since UnlockRule.referenceId and
 * Choice.nextSceneId aren't fully DB-constrained — this type is the
 * shape that validation logic operates over, not a player-facing
 * response.
 */
export interface StoryGraphSnapshot {
  nodes: StoryGraphNode[];
}
