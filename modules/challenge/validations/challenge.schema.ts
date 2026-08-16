// modules/challenge/validations/challenge.schema.ts
import { z } from "zod";

export const challengeSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Challenge slug is required.")
    .max(160, "Challenge slug cannot exceed 160 characters.")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Challenge slug can only contain letters, numbers, and hyphens.",
    ),
});

export type ChallengeSlugInput = z.infer<typeof challengeSlugSchema>;

/**
 * The player-facing challenge lookup is id-based, not slug-based — see
 * get-challenge.ts's own note. Same cuid2 validator submitFlagSchema
 * already uses for the same field.
 */
export const challengeIdSchema = z.object({
  challengeId: z.cuid2("Invalid challenge ID."),
});

export type ChallengeIdInput = z.infer<typeof challengeIdSchema>;