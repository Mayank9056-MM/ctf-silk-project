// toggle-registration.schema.ts

import { z } from "zod";

/**
 * Validates the desired registration state for Event Control.
 *
 * The actor is resolved separately from the authenticated session.
 * The event itself is resolved server-side as the platform's
 * configured Event singleton.
 */
export const toggleRegistrationSchema = z.object({
  enalbled: z.boolean({
    error: () => ({
      message: "Registration state must be a boolean.",
    }),
  }),
});

/**
 * The validated shape a Server Action passes into the
 * EventControl service.
 */
export type ToggleRegistrationSchema = z.infer<typeof toggleRegistrationSchema>;
