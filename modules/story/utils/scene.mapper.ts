import type { Evidence } from "@/app/generated/prisma/client";
import type { ResolvedScene } from "../types/scene.types";
import type { SceneDTO, ChoiceDTO, AdminSceneDTO, AdminChoiceDTO } from "../types/scene.dto";
import { toDialogueLineDTO, toAdminDialogueLineDTOList } from "./dialogue.mapper";
import { toEvidencePreviewDTO } from "./evidence.mapper";

function toChoiceDTO(choice: ResolvedScene["choices"][number]): ChoiceDTO {
  return { id: choice.id, order: choice.order, label: choice.label };
}

function toChoiceDTOList(choices: ResolvedScene["choices"]): ChoiceDTO[] {
  return choices.map(toChoiceDTO);
}

interface ToSceneDTOOptions {
  isCompleted: boolean;
  /**
   * The full Evidence row, if this scene is type EVIDENCE_REVEAL — the
   * mapper does no fetching of its own (no Prisma calls belong here), so
   * the caller supplies it after already resolving `scene.evidenceId`
   * via storyContentRepository. Omitted or null for every other scene
   * type, in which case `SceneDTO.evidence` comes out null regardless of
   * what's passed.
   */
  evidence?: Evidence | null;
}

/**
 * The one place allowed to see a ResolvedScene's full internal shape
 * (choice destinations, dialogue line ids, characterId) and choose what
 * a player actually receives — same discipline as every other mapper in
 * this build.
 */
export function toSceneDTO(resolved: ResolvedScene, options: ToSceneDTOOptions): SceneDTO {
  const { scene, choices } = resolved;

  return {
    id: scene.id,
    slug: scene.slug,
    title: scene.title,
    type: scene.type,
    dialogueLines: scene.dialogueLines.map(toDialogueLineDTO),
    choices: toChoiceDTOList(choices),
    challengeId: scene.challengeId,
    evidence: options.evidence ? toEvidencePreviewDTO(options.evidence) : null,
    isCompleted: options.isCompleted,
  };
}

function toAdminChoiceDTO(choice: ResolvedScene["choices"][number]): AdminChoiceDTO {
  return { id: choice.id, order: choice.order, label: choice.label, nextSceneId: choice.nextSceneId };
}

function toAdminChoiceDTOList(choices: ResolvedScene["choices"]): AdminChoiceDTO[] {
  return choices.map(toAdminChoiceDTO);
}

/**
 * ADMIN-only — full authoring fidelity, choices WITH real destinations,
 * dialogue lines WITH their own ids (required for a CMS edit view to
 * know what to PATCH). Built independently from toSceneDTO's source
 * data, not by adding fields onto its output — same "read the source
 * row twice, don't derive one shape from the other" discipline as every
 * prior admin/player mapper split in this module.
 */
export function toAdminSceneDTO(resolved: ResolvedScene): AdminSceneDTO {
  const { scene, choices } = resolved;

  return {
    id: scene.id,
    chapterId: scene.chapterId,
    slug: scene.slug,
    title: scene.title,
    type: scene.type,
    order: scene.order,
    status: scene.status,
    challengeId: scene.challengeId,
    evidenceId: scene.evidenceId,
    // Json → Record cast rests on an authoring convention (metadata is
    // always written as an object, never an array/primitive), not
    // something Prisma's JsonValue type enforces on its own — worth a
    // CMS-side write-time validation if that convention ever needs
    // enforcing harder than a comment.
    metadata: scene.metadata as Record<string, unknown> | null,
    dialogueLines: toAdminDialogueLineDTOList(scene.dialogueLines),
    choices: toAdminChoiceDTOList(choices),
    createdAt: scene.createdAt,
    updatedAt: scene.updatedAt,
  };
}