import { z } from "zod";

// ============================================================================
// get-hints.schema.ts
// ============================================================================

/**
 * Backs getChallengeHints(). `challengeId` is trimmed before the format
 * check runs, so incidental whitespace from a client doesn't produce a
 * confusing "invalid cuid" rejection for what was otherwise a valid id.
 */
export const getHintsSchema = z.object({
  challengeId: z
    .string()
    .trim()
    .cuid({ message: "challengeId must be a valid challenge identifier." }),
});

export type GetHintsInput = z.infer<typeof getHintsSchema>;
