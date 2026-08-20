"use server";

import { requirePermission } from "@/modules/auth/authorization/require-role";
import { Permission } from "@/modules/auth/authorization/permission";

import { leaderboardService } from "../services/leaderboard.service";
import { getLeaderboardSchema } from "../validations/get-leaderboard.schema";
import type { AdminLeaderboardDTO } from "../types/leaderboard.dto";

/**
 * Admin-only read of the live standings table (never the frozen view —
 * see AdminLeaderboardDTO's own doc comment on why there is no frozen
 * branch for admin at all).
 *
 * Reuses getLeaderboardSchema as-is rather than a new
 * get-admin-leaderboard.schema.ts: the admin request shape is
 * identical to the player one (page/pageSize, nothing else) — there is
 * no "frozen"/"asOf" field to admit here either, same reasoning that
 * schema's own header gives for why one will never be added.
 *
 * Gated on Permission.MANAGE_EVENTS, matching freeze-leaderboard.ts /
 * unfreeze-leaderboard.ts's own choice for the same reason stated
 * there: leaderboardFrozenAt physically lives on Event, and there is
 * no dedicated Permission.MANAGE_LEADERBOARD today. If one is
 * introduced later, this line and those two actions' gate should
 * change together.
 *
 * Follows this module's majority read-action convention (getPlayer,
 * getPlayers, getEventControl, getAuditLog: throw ApiError, return the
 * DTO directly) rather than freeze/unfreeze's ActionState<void> wrapper
 * — that wrapper exists on the two mutations because they're invoked
 * directly from a form action; a read has no equivalent reason to
 * diverge from every other read in the codebase.
 */
export async function getAdminLeaderboard(
  input: unknown,
): Promise<AdminLeaderboardDTO> {
  await requirePermission(Permission.MANAGE_EVENTS);

  const { page, pageSize } = getLeaderboardSchema.parse(input);

  return leaderboardService.getAdminLeaderboard(page, pageSize);
}
