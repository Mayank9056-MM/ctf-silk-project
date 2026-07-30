import { z } from "zod";

/**
 * Input for the branching-advance action. Both IDs client-supplied;
 * `userId` still comes from the verified session at the action layer,
 * same as every other write path here. `currentSceneId` serves the same
 * staleness-check purpose it does in advance-scene.schema.ts —
 * confirming the client's view of "where I am" still matches reality
 * before storyNavigationService does anything with `choiceId`.
 *
 * No cross-field check here confirming the choice actually belongs to
 * currentSceneId — that's deliberately NOT this schema's job. Zod
 * validates shape (two well-formed IDs); storyNavigationService.selectChoice
 * validates the relationship between them by actually querying
 * `currentScene`'s real choices and confirming `choiceId` is among them.
 * A Zod schema has no database access, so it can only ever check "these
 * are IDs," never "these IDs are consistent with each other" — that
 * validation lives exactly once, in the service, not duplicated here as
 * a shape the schema can't actually enforce.
 */
export const selectChoiceSchema = z.object({
  currentSceneId: z.cuid2("Invalid scene ID."),
  choiceId: z.cuid2("Invalid choice ID."),
});

export type SelectChoiceInput = z.infer<typeof selectChoiceSchema>;
