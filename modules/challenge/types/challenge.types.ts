import type {
  Challenge,
  ChallengeAttachment,
} from "@/app/generated/prisma/client";

/**
 * Challenge with its attachments.
 */
export type ChallengeWithAttachments = Challenge & {
  attachments: ChallengeAttachment[];
};

/**
 * Response returned after verifying a submitted flag.
 */
export type SubmitFlagResult = {
  isCorrect: boolean;
  xpAwarded: number;
  message: string;
};

/**
 * Public challenge data exposed to the client.
 * Does NOT expose sensitive fields like flagHash.
 */
export type PublicChallenge = Omit<Challenge, "flagHash"> & {
  attachments: ChallengeAttachment[];
};

/**
 * Minimal challenge information used in challenge lists.
 */
export type ChallengeListItem = Pick<
  Challenge,
  | "id"
  | "title"
  | "slug"
  | "chapter"
  | "displayOrder"
  | "difficulty"
  | "xpReward"
  | "createdAt"
>;
