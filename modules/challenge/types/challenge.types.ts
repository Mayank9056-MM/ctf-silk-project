import type {
  Challenge,
  ChallengeAttachment,
  ChallengeAttachmentType,
} from "@/app/generated/prisma/client";

/**
 * Challenge with its attachments.
 */
export type ChallengeWithAttachments = Challenge & {
  attachments: ChallengeAttachment[];
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
  | "chapterId"
  | "displayOrder"
  | "difficulty"
  | "xpReward"
  | "createdAt"
>;

/**
 * A single attachment as exposed to a player. Deliberately excludes
 * `filePath` (the raw storage location) — a player never gets a
 * filesystem/storage path, only a `downloadUrl` pointing at the
 * authenticated attachment route, which re-derives ChallengeAccessService
 * authorization independently on every request. See
 * app/api/challenges/[challengeId]/attachments/[attachmentId]/route.ts.
 */
export interface PlayerAttachmentDTO {
  id: string;
  type: ChallengeAttachmentType;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  order: number;
  downloadUrl: string;
}

/**
 * The explicit player-facing challenge contract — NOT
 * Omit<Challenge, "flagHash">. Only fields the challenge UI actually
 * needs. No `description` field: Challenge has none in the schema, and
 * one is not invented here. No chapterId/displayOrder/createdAt/
 * updatedAt: authoring/organizational metadata a player has no use for
 * and that adds unnecessary surface area to a response an unauthorized
 * player must never distinguishably receive.
 */
export interface PlayerChallengeDTO {
  id: string;
  slug: string;
  title: string;
  difficulty: number;
  xpReward: number;
  attachments: PlayerAttachmentDTO[];
}
