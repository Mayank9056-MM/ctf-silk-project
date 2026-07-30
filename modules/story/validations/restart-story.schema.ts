import { z } from "zod";

/**
 * Deliberately requires an explicit confirmation, not just a bare call
 * with no body — restartStory wipes SceneCompletion, ChoiceSelection,
 * and StoryProgress with no undo path (storyProgressRepository.resetProgress
 * has no soft-delete, no history table behind it). A player accidentally
 * triggering this from a stray double-click or a client-side bug
 * shouldn't be able to lose real progress without the request itself
 * carrying unambiguous intent — the same reasoning `pauseEvent`/
 * `freezeLeaderboard` apply to double-click protection, one layer more
 * serious here since this discards player data rather than just
 * rejecting a redundant admin action.
 *
 * z.literal(true), not z.boolean() — a client that sends `confirm: false`
 * or omits the field entirely fails validation outright, rather than
 * "false" being accepted as a valid-but-declining input the action then
 * has to branch on. There is no meaningful "restart, but don't confirm"
 * request; the schema encodes that directly.
 */
export const restartStorySchema = z.object({
  confirm: z.literal(true, {
    message: "You must confirm this action before restarting your progress.",
  }),
});

export type RestartStoryInput = z.infer<typeof restartStorySchema>;
