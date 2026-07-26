import { z } from "zod";

/**
 * Validates a specific player's ID for a public-profile-style rank
 * lookup. getMyRank needs no schema at all — its only "input" is the
 * caller's own session identity via requireAuth(), which is why your
 * validations folder correctly has no get-my-rank.schema.ts.
 */
export const getUserRankSchema = z.object({
  userId: z.cuid2("Invalid user ID."),
});

export type GetUserRankInput = z.infer<typeof getUserRankSchema>;
