import type { SceneWithDialogue } from "../repositories/story-content.repository";
import type { DialogueLineDTO, DialogueSequenceDTO, AdminDialogueLineDTO } from "../types/dialogue.dto";

/**
 * The one place allowed to read a DialogueLine's full row (including its
 * own id and raw characterId) and choose not to forward them to a
 * player. A line's id has no player-facing use — see DialogueLineDTO's
 * own comment on that — and characterId is an internal reference a
 * player has no reason to see once its speaker's displayName/portraitUrl
 * are already resolved.
 */
export function toDialogueLineDTO(
  line: SceneWithDialogue["dialogueLines"][number],
): DialogueLineDTO {
  return {
    order: line.order,
    content: line.content,
    speaker: line.character
      ? { displayName: line.character.displayName, portraitUrl: line.character.portraitUrl }
      : null,
    audioUrl: line.audioUrl,
  };
}

export function toDialogueSequenceDTO(scene: SceneWithDialogue): DialogueSequenceDTO {
  return {
    sceneId: scene.id,
    lines: scene.dialogueLines.map(toDialogueLineDTO),
  };
}

/**
 * ADMIN-only mapper — the full row, id and characterId included, for a
 * CMS editing view. Deliberately not built by re-shaping
 * toDialogueLineDTO's output (adding fields back on): the two mappers
 * read the same source row independently, so a future field added to
 * one has to be a deliberate decision in the other, not something that
 * silently rides along because one was derived from the other.
 */
export function toAdminDialogueLineDTO(
  line: SceneWithDialogue["dialogueLines"][number],
): AdminDialogueLineDTO {
  return {
    id: line.id,
    order: line.order,
    content: line.content,
    characterId: line.characterId,
    speaker: line.character
      ? { displayName: line.character.displayName, portraitUrl: line.character.portraitUrl }
      : null,
    audioUrl: line.audioUrl,
  };
}

export function toAdminDialogueLineDTOList(
  lines: SceneWithDialogue["dialogueLines"],
): AdminDialogueLineDTO[] {
  return lines.map(toAdminDialogueLineDTO);
}