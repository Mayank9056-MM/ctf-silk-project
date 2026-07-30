import { z } from "zod";

/**
 * Input for revisiting an already-completed scene. Just the scene ID —
 * `storyService.replayScene` (delegating to `sceneService.getSceneForReplay`)
 * does the actual "was this really completed" gate itself, reading
 * SceneCompletion directly rather than trusting anything the client
 * claims about its own history. This schema only rules out a malformed
 * ID before that check runs; it grants no access on its own.
 */
export const replaySceneSchema = z.object({
  sceneId: z.cuid2("Invalid scene ID."),
});

export type ReplaySceneInput = z.infer<typeof replaySceneSchema>;
