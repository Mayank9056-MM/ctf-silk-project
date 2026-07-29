import type { ChapterDTO } from "./chapter.dto";
import type { SceneDTO } from "./scene.dto";
import type { StoryProgressDTO } from "./progress.dto";

/**
 * The composed "what should the player see right now" response —
 * returned by getCurrentScene, advanceScene, selectChoice, and
 * replayScene alike, so the client gets chapter context, the scene
 * itself, and updated progress in one round trip rather than three
 * separate fetches after every transition.
 *
 * `scene` is nullable for exactly one case: the player has completed the
 * entire story (progress.status === "COMPLETED") and there is no next
 * scene to render — the client should show a completion/epilogue screen
 * instead of a scene, driven by `progress.status`, not by scene being
 * unexpectedly null.
 */
export interface StoryStateDTO {
  chapter: ChapterDTO;
  scene: SceneDTO | null;
  progress: StoryProgressDTO;
}

/**
 * Per-chapter player-count distribution — how many players currently
 * have their StoryProgress pointing at each chapter. The concrete,
 * useful shape behind the "who's stuck" live admin view flagged in
 * progress.dto.ts: a chapter with an unexpectedly large player count
 * relative to its neighbors is the signal that something in it (a
 * confusing puzzle, a broken asset) is bottlenecking the event in real
 * time, not just after the fact.
 */
export interface ChapterProgressDistributionDTO {
  chapterSlug: string;
  chapterTitle: string;
  playerCount: number;
}

export interface AdminStoryOverviewDTO {
  totalPlayers: number;
  completedPlayers: number;
  distribution: ChapterProgressDistributionDTO[];
}
