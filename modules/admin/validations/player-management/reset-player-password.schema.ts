// reset-player-password.schema.ts

import { z } from "zod";

/**
 * Input validation for resetting a player's password from the
 * Admin player-management module.
 *
 * The admin does not provide the new password. The service generates
 * a temporary password securely and handles hashing/storage.
 *
 * Authorization, player existence, password generation, hashing,
 * session revocation, audit recording, and notification creation
 * belong to playerManagementService.
 */
export const resetPlayerPasswordSchema = z.object({
  playerId: z.string().trim().min(1, "Player ID is required."),
});

/**
 * Validated input passed from the Server Action to
 * playerManagementService.resetPlayerPassword().
 */
export type ResetPlayerPasswordSchema = z.infer<
  typeof resetPlayerPasswordSchema
>;
