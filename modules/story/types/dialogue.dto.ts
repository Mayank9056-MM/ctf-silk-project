/**
 * The speaking character, or null for unattributed narration (a caption,
 * a text-log excerpt read aloud by no one in particular). `portraitUrl`
 * nullable separately — a character can exist without portrait art yet
 * (mid-authoring) even once everything else about them is set.
 */
export interface DialogueSpeakerDTO {
  displayName: string;
  portraitUrl: string | null;
}

/**
 * One line of dialogue as a player receives it. No `id` on the line
 * itself — a player has no action to take against an individual
 * dialogue line (unlike a Choice, which needs an id to be selected), so
 * there's nothing here for a client to reference back to the server by.
 * `order` stays, since the client renders lines sequentially and it's
 * cheap, honest information already public by virtue of the line being
 * shown at all.
 */
export interface DialogueLineDTO {
  order: number;
  content: string;
  speaker: DialogueSpeakerDTO | null;
  audioUrl: string | null;
}

export interface DialogueSequenceDTO {
  sceneId: string;
  lines: DialogueLineDTO[];
}

/**
 * Admin-only — full authoring fidelity: the line's own id (for editing/
 * reordering), the raw characterId (for a CMS dropdown bound to a
 * specific Character record, not just its display name), and audit
 * timestamps. A player-facing DialogueLineDTO is intentionally not a
 * subset of this one at the type level (no `extends`) — the two evolve
 * for different audiences, and forcing a structural relationship between
 * them is the kind of coupling that made the flagHash leak possible when
 * a single shape tried to serve two purposes.
 */
export interface AdminDialogueLineDTO {
  id: string;
  order: number;
  content: string;
  characterId: string | null;
  speaker: DialogueSpeakerDTO | null;
  audioUrl: string | null;
}