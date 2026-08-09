// ban-player.schema.ts

import { z } from "zod";

/**
 * Input validation for banning a player from the Admin
 * player-management module.
 *
 * The player ID is the only client-supplied value required.
 * Authorization and the actual ACTIVE → BANNED transition
 * are handled by playerManagementService.
 */
export const banPlayerSchema = z.object({
  playerId: z.string().trim().min(1, "Player ID is required."),
});

/**
 * Validated input passed from the Server Action
 * to playerManagementService.banPlayer().
 */
export type BanPlayerSchema = z.infer<typeof banPlayerSchema>;
