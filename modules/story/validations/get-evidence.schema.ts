// modules/story/validations/get-evidence.schema.ts
import { z } from "zod";

/**
 * Input for opening a single piece of evidence. Just the ID —
 * evidenceService.getEvidence does the actual "is this unlocked for this
 * player" check itself, reading UnlockRule/SceneCompletion directly
 * rather than trusting anything the client claims. This schema only
 * rules out a malformed ID before that check runs; it grants no access
 * on its own.
 */
export const getEvidenceSchema = z.object({
  evidenceId: z.cuid2("Invalid evidence ID."),
});

export type GetEvidenceInput = z.infer<typeof getEvidenceSchema>;