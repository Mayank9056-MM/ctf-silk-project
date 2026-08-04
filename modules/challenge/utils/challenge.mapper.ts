import type {
  Challenge,
  ChallengeAttachment,
} from "@/app/generated/prisma/client";
import type {
  PublicChallenge,
  ChallengeListItem,
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
