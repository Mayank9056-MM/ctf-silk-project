// get-player.schema.ts

import { z } from "zod";

/**
 * Input validation for retrieving a single player
 * from the Admin player-management module.
 *
 * The player ID is the only client-supplied value required.
 * Authorization is handled separately by requireAuth() and
 * playerManagementService; this schema only validates input shape.
 */
export const getPlayerSchema = z.object({
  playerId: z.string().trim().min(1, "Player ID is required."),
});

/**
 * Validated input passed from the Server Action
 * to playerManagementService.getPlayer().
 */
export type GetPlayerSchema = z.infer<typeof getPlayerSchema>;
