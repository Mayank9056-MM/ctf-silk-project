// unban-player.schema.ts

import { z } from "zod";

/**
 * Input validation for unbanning a player from the Admin
 * player-management module.
 *
 * The player ID is the only client-supplied value required.
 * Authorization and the actual BANNED → ACTIVE transition
 * are handled by playerManagementService.
 */
export const unbanPlayerSchema = z.object({
  playerId: z.string().trim().min(1, "Player ID is required."),
});

/**
 * Validated input passed from the Server Action
 * to playerManagementService.unbanPlayer().
 */
export type UnbanPlayerSchema = z.infer<typeof unbanPlayerSchema>;
