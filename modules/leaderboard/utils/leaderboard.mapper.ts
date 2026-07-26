import type {
  LeaderboardEntryWithUser,
  FrozenLeaderboardRow,
  AdminLeaderboardEntryWithUser,
  UserRankResult,
} from "../types/leaderboard.types";
import { LeaderboardScope } from "../types/leaderboard.enums";
import type {
  LeaderboardDTO,
  UserRankDTO,
  AdminLeaderboardDTO,
} from "../types/leaderboard.dto";

/**
 * Attaches rank to a page of rows. Rank is 1-based and absolute to the
 * page's position, not reset per page — row 1 on page 2 (pageSize 25) is
 * rank 26, not rank 1. Never persisted — see the leaderboard model
 * review's "don't store rank" note; recomputed here every time instead.
 */
function attachRank<T>(rows: T[], startRank: number): (T & { rank: number })[] {
  return rows.map((row, index) => ({ ...row, rank: startRank + index }));
}

function fromLiveEntry(entry: LeaderboardEntryWithUser) {
  return {
    userId: entry.userId,
    username: entry.user.username,
    fullName: entry.user.fullName,
    totalXp: entry.totalXp,
    solvedChallenges: entry.solvedChallenges,
    lastSolvedAt: entry.lastSolvedAt,
  };
}

function fromFrozenRow(row: FrozenLeaderboardRow) {
  return {
    userId: row.userId,
    username: row.username,
    fullName: row.fullName,
    totalXp: row.totalXp,
    solvedChallenges: row.solvedChallenges,
    lastSolvedAt: row.lastSolvedAt,
  };
}

/**
 * Builds a ranked, paginated PLAYER-facing page from whichever scope the
 * service already resolved. This function never decides live vs. frozen
 * itself — that decision (and the two different queries behind it)
 * already happened in LeaderboardService before rows reach here. Mixing
 * "which query to run" into "how to shape the result" is the kind of
 * coupling that made the flagHash leak possible in the challenge module;
 * keeping them separate here is deliberate.
 */
export function toLeaderboardDTO(
  rows: LeaderboardEntryWithUser[] | FrozenLeaderboardRow[],
  scope: LeaderboardScope,
  page: number,
  pageSize: number,
  totalCount: number,
): LeaderboardDTO {
  const normalized =
    scope === LeaderboardScope.LIVE
      ? (rows as LeaderboardEntryWithUser[]).map(fromLiveEntry)
      : (rows as FrozenLeaderboardRow[]).map(fromFrozenRow);

  const startRank = (page - 1) * pageSize + 1;

  return {
    isFrozen: scope === LeaderboardScope.FROZEN,
    page,
    pageSize,
    totalCount,
    rows: attachRank(normalized, startRank),
  };
}

/**
 * Single-row version for getMyRank/getUserRank. `result.rank` comes from
 * the service's own "count rows ranked above this one, +1" query — there's
 * no surrounding page here for attachRank to index into.
 */
export function toUserRankDTO(result: UserRankResult): UserRankDTO {
  return {
    isFrozen: result.scope === LeaderboardScope.FROZEN,
    rank: result.rank,
    totalXp: result.totalXp,
    solvedChallenges: result.solvedChallenges,
    lastSolvedAt: result.lastSolvedAt,
  };
}

/**
 * ADMIN-only mapper. Deliberately takes no `scope` parameter at all,
 * unlike toLeaderboardDTO above — there is no frozen branch for admin to
 * hit. The asymmetry is enforced by the input type, not by a runtime
 * check: AdminLeaderboardEntryWithUser is only ever produced by a
 * live-query repository method (see leaderboard.repository.ts's future
 * findAdminEntries, not a findFrozenAdminEntries that doesn't exist), so
 * there's no code path by which frozen data could reach this function.
 * A freeze bug here would have to be a wrong repository call upstream,
 * not a missing check in this mapper.
 */
export function toAdminLeaderboardDTO(
  rows: AdminLeaderboardEntryWithUser[],
  page: number,
  pageSize: number,
  totalCount: number,
  leaderboardFrozenAt: Date | null,
): AdminLeaderboardDTO {
  const normalized = rows.map((entry) => ({
    userId: entry.userId,
    username: entry.user.username,
    fullName: entry.user.fullName,
    email: entry.user.email,
    totalXp: entry.totalXp,
    solvedChallenges: entry.solvedChallenges,
    lastSolvedAt: entry.lastSolvedAt,
    updatedAt: entry.updatedAt,
  }));

  const startRank = (page - 1) * pageSize + 1;

  return {
    leaderboardFrozenAt,
    page,
    pageSize,
    totalCount,
    rows: attachRank(normalized, startRank),
  };
}
