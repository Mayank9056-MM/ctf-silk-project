import { z } from "zod";

/**
 * Validates the input required to pause the event.
 *
 * The pause reason is optional because an administrator may pause
 * the event without providing a reason.
 *
 * Authorization and actor identity are handled by the action/service
 * layer and are intentionally not part of this schema.
 */
export const pauseEventSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Pause reason must not exceed 500 characters.")
    .nullable()
    .optional(),
});

export type PauseEventInput = z.infer<typeof pauseEventSchema>;
