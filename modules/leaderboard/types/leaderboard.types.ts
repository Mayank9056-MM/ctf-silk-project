import type { LeaderboardEntry, User } from "@/app/generated/prisma/client";
import type { LeaderboardScope } from "./leaderboard.enums";

/**
 * One row from the live LeaderboardEntry cache, joined with just enough
 * User data to render a name. Internal — never returned from an action
 * as-is; see LeaderboardRowDTO for the client-safe shape.
 */
export type LeaderboardEntryWithUser = LeaderboardEntry & {
  user: Pick<User, "id" | "username" | "fullName">;
};

/**
 * One row computed on the fly for the frozen public view — aggregated
 * directly from ChallengeSolve filtered by solvedAt <= frozenAt, since
 * LeaderboardEntry itself only ever reflects live/current state and has
 * no historical "as of" query path of its own. Field names mirror
 * LeaderboardEntryWithUser so both paths can feed the same mapper.
 */
export interface FrozenLeaderboardRow {
  userId: string;
  username: string;
  fullName: string;
  totalXp: number;
  solvedChallenges: number;
  lastSolvedAt: Date | null;
}

/**
 * Either row shape, with rank attached after sorting — rank is always
 * computed at read time (see the "never store rank" note from the model
 * review), never persisted.
 */
export interface RankedRow {
  rank: number;
  userId: string;
  username: string;
  fullName: string;
  totalXp: number;
  solvedChallenges: number;
  lastSolvedAt: Date | null;
}

export interface PaginatedLeaderboard {
  scope: LeaderboardScope;
  page: number;
  pageSize: number;
  totalCount: number;
  rows: RankedRow[];
}

export interface UserRankResult {
  scope: LeaderboardScope;
  /** null if the user hasn't solved anything yet — unranked, not rank 0. */
  rank: number | null;
  totalXp: number;
  solvedChallenges: number;
  lastSolvedAt: Date | null;
}

/**
 * Admin-only row shape — includes email (for contact/verification during
 * prize resolution) and updatedAt (for dispute auditing: "when did this
 * player's standing last change"). Only ever produced by a live-query
 * repository method — there is no frozen-scope equivalent of this type,
 * which is what makes "admin never sees frozen data" enforceable at the
 * type level rather than just a convention to remember.
 */
export type AdminLeaderboardEntryWithUser = LeaderboardEntry & {
  user: Pick<User, "id" | "username" | "fullName" | "email">;
};

/**
 * Raw result of a single-user rank lookup, before the service attaches
 * `scope`. Returned by findLiveRank/findFrozenRank — `null` means the
 * user has no LeaderboardEntry (or no qualifying solves for the frozen
 * cutoff) at all, i.e. unranked, not "rank 0."
 */
export interface RankLookupResult {
  rank: number;
  totalXp: number;
  solvedChallenges: number;
  lastSolvedAt: Date | null;
}