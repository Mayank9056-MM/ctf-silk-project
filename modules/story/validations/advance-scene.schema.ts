import { z } from "zod";

/**
 * Input for the linear-advance action — no choice involved. Only
 * `currentSceneId` is client-supplied; `userId` comes from the verified
 * session at the action layer, same as every other write path in this
 * build (submitFlag, freeze/unfreeze). `currentSceneId` exists at all
 * only so storyNavigationService.requireCurrentScene can confirm it
 * still matches the player's real position before doing anything —
 * it's a staleness check, not something the server trusts as an
 * instruction to jump anywhere.
 */
export const advanceSceneSchema = z.object({
  currentSceneId: z.cuid2("Invalid scene ID."),
});

export type AdvanceSceneInput = z.infer<typeof advanceSceneSchema>;
