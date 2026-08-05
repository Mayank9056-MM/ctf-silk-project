import { z } from "zod";

// ============================================================================
// unlock-hint.schema.ts
// ============================================================================

/**
 * Backs unlockHint(). `hintId` is trimmed before the format check runs,
 * so incidental whitespace from a client doesn't produce a confusing
 * "invalid cuid" rejection for what was otherwise a valid id.
 */
export const unlockHintSchema = z.object({
  hintId: z.cuid2({ message: "hintId must be a valid hint identifier." }),
});

export type UnlockHintInput = z.infer<typeof unlockHintSchema>;
