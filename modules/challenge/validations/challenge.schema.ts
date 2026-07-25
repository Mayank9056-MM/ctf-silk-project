import { z } from "zod";

/**
 * Challenge slug validation.
 */
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
