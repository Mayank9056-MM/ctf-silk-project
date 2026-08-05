import { z } from "zod";

// ============================================================================
// unlock-hint.schema.ts
// ============================================================================

export const unlockHintSchema = z.object({
  hintId: z.cuid2({ message: "hintId must be a valid hint identifier." }),
});

export type UnlockHintInput = z.infer<typeof unlockHintSchema>;
