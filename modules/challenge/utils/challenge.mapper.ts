import type {
  Challenge,
  ChallengeAttachment,
} from "@/app/generated/prisma/client";
import type {
  PublicChallenge,
  ChallengeListItem,
  PlayerAttachmentDTO,
  PlayerChallengeDTO,
} from "../types/challenge.types";

type ChallengeWithMaybeHash = Omit<Challenge, "flagHash"> &
  Partial<Pick<Challenge, "flagHash">>;

type ChallengeWithAttachmentsInput = ChallengeWithMaybeHash & {
  attachments: ChallengeAttachment[];
};

/**
 * Strips flagHash defensively, even though the repository's `omit`
 * already excludes it at the query level — belt-and-suspenders. If a
 * future method forgets `omit: { flagHash: true }`, this still catches
 * it before an action can return the field.
 */
export function toPublicChallenge(
  challenge: ChallengeWithAttachmentsInput,
): PublicChallenge {
  const { flagHash: _flagHash, ...rest } = challenge as Challenge & {
    attachments: ChallengeAttachment[];
  };
  return rest;
}

export function toPublicChallengeList(
  challenges: ChallengeWithAttachmentsInput[],
): PublicChallenge[] {
  return challenges.map(toPublicChallenge);
}

/**
 * Narrows to the minimal shape used in list/board views — no attachments,
 * no timestamps beyond what's needed to sort/display.
 */
export function toChallengeListItem(
  challenge: ChallengeWithMaybeHash,
): ChallengeListItem {
  const {
    id,
    title,
    slug,
    chapterId: chapter,
    displayOrder,
    difficulty,
    xpReward,
    createdAt,
  } = challenge;
  return {
    id,
    title,
    slug,
    chapterId: chapter,
    displayOrder,
    difficulty,
    xpReward,
    createdAt,
  };
}

/**
 * A single attachment → PlayerAttachmentDTO. `filePath` is deliberately
 * never read here — the download URL is derived purely from
 * challengeId/attachment.id, never from the stored path, so this mapper
 * cannot leak storage location even by accident.
 */
function toPlayerAttachmentDTO(
  challengeId: string,
  attachment: ChallengeAttachment,
): PlayerAttachmentDTO {
  return {
    id: attachment.id,
    type: attachment.type,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    order: attachment.order,
    downloadUrl: `/api/challenges/${challengeId}/attachments/${attachment.id}`,
  };
}

/**
 * The player-facing challenge mapper — the ONLY function that should
 * ever produce a PlayerChallengeDTO. Takes a challenge that already had
 * flagHash omitted at the query level (findBySlug/findById); does not
 * re-verify that here since toPublicChallenge already provides that
 * defensive strip for the PublicChallenge path, and this narrows further
 * from a PublicChallenge-shaped input, never from a raw Challenge.
 */
export function toPlayerChallengeDTO(
  challenge: ChallengeWithAttachmentsInput,
): PlayerChallengeDTO {
  const safe = toPublicChallenge(challenge);
  return {
    id: safe.id,
    slug: safe.slug,
    title: safe.title,
    description: safe.description,
    difficulty: safe.difficulty,
    xpReward: safe.xpReward,
    attachments: safe.attachments.map((a) => toPlayerAttachmentDTO(safe.id, a)),
  };
}
