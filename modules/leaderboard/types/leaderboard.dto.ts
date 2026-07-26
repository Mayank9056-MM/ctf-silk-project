/**
 * Client-facing row shape. No `scope`/`LeaderboardScope` value here by
 * design — `isFrozen` is a plain boolean the client only ever reads, an
 * output the server decided, not an input it could set. That distinction
 * is the whole point: reporting the current state back to the client is
 * fine; accepting it as a parameter is the vulnerability.
 */
export interface LeaderboardRowDTO {
  rank: number;
  userId: string;
  username: string;
  fullName: string;
  totalXp: number;
  solvedChallenges: number;
  lastSolvedAt: Date | null;
}

export interface LeaderboardDTO {
  isFrozen: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  rows: LeaderboardRowDTO[];
}

export interface UserRankDTO {
  isFrozen: boolean;
  rank: number | null;
  totalXp: number;
  solvedChallenges: number;
  lastSolvedAt: Date | null;
}

export interface AdminLeaderboardRowDTO {
  rank: number;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  totalXp: number;
  solvedChallenges: number;
  lastSolvedAt: Date | null;
  updatedAt: Date;
}

export interface AdminLeaderboardDTO {
  /**
   * Informational only — tells the admin UI whether players currently
   * see a frozen board (e.g. to show a "Frozen since 3:40 PM" badge).
   * Never used to filter these rows: admin data is always current
   * regardless of this value. No `isFrozen` boolean here, unlike the
   * player DTO — for admin there's no ambiguity to report, so the raw
   * timestamp is more useful than a flag.
   */
  leaderboardFrozenAt: Date | null;
  page: number;
  pageSize: number;
  totalCount: number;
  rows: AdminLeaderboardRowDTO[];
}
