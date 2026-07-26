import { z } from "zod";
import { LEADERBOARD_CONSTANTS } from "../constants/leaderboard.constants";

/**
 * Deliberately NO "frozen"/"live"/"asOf" field here, and none should ever
 * be added. Whether a caller sees the frozen or live board is decided
 * server-side in the service, from Event.leaderboardFrozenAt plus the
 * caller's role — never from client input. The entire point of freezing
 * is to stop players from watching standings shift right before the
 * result is announced; a client-supplied override would let anyone
 * bypass that by just requesting the live view directly.
 */
export const getLeaderboardSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(LEADERBOARD_CONSTANTS.MAX_PAGE_SIZE)
    .default(LEADERBOARD_CONSTANTS.DEFAULT_PAGE_SIZE),
});

export type GetLeaderboardInput = z.infer<typeof getLeaderboardSchema>;