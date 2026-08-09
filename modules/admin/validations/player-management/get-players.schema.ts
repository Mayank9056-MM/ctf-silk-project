// get-players.schema.ts

import { z } from "zod";
import { UserStatus } from "@/app/generated/prisma/enums";
import { PLAYER_MANAGEMENT_LIMITS } from "../../constants/player-management.constants";

/**
 * Input validation for the paginated Admin player-management list.
 *
 * Search is optional. When provided, it is trimmed and bounded so the
 * repository never receives an unnecessarily large search string.
 *
 * Status is validated against the actual Prisma UserStatus enum rather
 * than a manually maintained string union.
 *
 * Pagination is one-based:
 * - page must be >= 1
 * - pageSize must be within the module's configured maximum
 */
export const getPlayersSchema = z.object({
  search: z
    .string()
    .trim()
    .max(
      PLAYER_MANAGEMENT_LIMITS.SEARCH_MAX_LENGTH,
      `Search must not exceed ${PLAYER_MANAGEMENT_LIMITS.SEARCH_MAX_LENGTH} characters.`,
    )
    .optional(),

  status: z
    .enum(UserStatus, {
      error: () => ({
        message: "Please select a valid player status.",
      }),
    })
    .optional(),

  page: z
    .number()
    .int("Page must be an integer.")
    .min(1, "Page must be at least 1."),

  pageSize: z
    .number()
    .int("Page size must be an integer.")
    .min(1, "Page size must be at least 1.")
    .max(
      PLAYER_MANAGEMENT_LIMITS.PAGE_SIZE_MAX,
      `Page size must not exceed ${PLAYER_MANAGEMENT_LIMITS.PAGE_SIZE_MAX}.`,
    ),
});

/**
 * Validated input passed from the Server Action
 * to playerManagementService.getPlayers().
 */
export type GetPlayersSchema = z.infer<typeof getPlayersSchema>;