import type { DialogueLineDTO } from "./dialogue.dto";
import type { AdminDialogueLineDTO } from "./dialogue.dto";
import type { SceneType, ContentStatus } from "@/app/generated/prisma/enums";
import { EvidencePreviewDTO } from "./evidence.dto";

/**
 * A choice as a player receives it — no `nextSceneId`. See ChoiceDTO's
 * counterpart on the admin side for why: a player picks by `id`, the
 * server alone decides what happens next, and exposing the destination
 * in advance would let a curious player inspect the network response to
 * peek at a branch before choosing it.
 */
export interface ChoiceDTO {
  id: string;
  order: number;
  label: string;
}

/**
 * One playable scene, fully assembled — dialogue, choices, and whichever
 * of challengeId/evidence applies to this scene's type, all in one
 * response so the client never needs a second round-trip just to render
 * what it was just handed.
 *
 * `dialogueLines`/`choices` apply regardless of `type` — the schema
 * doesn't restrict Choice.sceneId to scenes of type CHOICE, and a
 * DIALOGUE scene routinely ends in a trailing choice (matching the
 * reference build's debrief screen: dialogue plays out, then two choice
 * buttons appear). `type` only ever picks which themed renderer mounts
 * client-side — it never gates which fields this DTO populates.
 */
export interface SceneDTO {
  id: string;
  slug: string;
  title: string | null;
  type: SceneType;

  dialogueLines: DialogueLineDTO[];
  choices: ChoiceDTO[];

  /** Set only for CHALLENGE_GATE scenes — the challenge the player must solve to advance. */
  challengeId: string | null;
  /** Set only for EVIDENCE_REVEAL scenes — the evidence this scene unlocked. */
  evidence: EvidencePreviewDTO | null;

  /**
   * Computed per-player at request time from SceneCompletion, never
   * stored — same "derive, don't cache" discipline as ChapterProgressState.
   * Drives a "replay" affordance vs. a fresh first-time render (e.g.
   * skipping typewriter pacing on a scene the player has already seen).
   */
  isCompleted: boolean;
}

/**
 * Admin-only — full authoring fidelity: raw ordering/lifecycle fields,
 * the untyped cinematic `metadata` blob, chapterId for the CMS's
 * chapter-scoped editor, and choices WITH their real destinations. Not
 * derived from SceneDTO via `extends` — same reasoning as
 * AdminDialogueLineDTO: the two shapes serve different audiences and
 * should be free to diverge independently, not structurally coupled.
 */
export interface AdminSceneDTO {
  id: string;
  chapterId: string;
  slug: string;
  title: string | null;
  type: SceneType;
  order: number;
  status: ContentStatus;

  challengeId: string | null;
  evidenceId: string | null;
  metadata: Record<string, unknown> | null;

   dialogueLines: AdminDialogueLineDTO[]; // was DialogueLineDTO[]
  choices: AdminChoiceDTO[];

  createdAt: Date;
  updatedAt: Date;
}

/** Admin's view of a choice — includes the real destination for graph editing. */
export interface AdminChoiceDTO {
  id: string;
  order: number;
  label: string;
  nextSceneId: string | null;
}