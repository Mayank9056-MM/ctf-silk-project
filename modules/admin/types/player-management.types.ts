import type { UserStatus } from "@/app/generated/prisma/enums";
import type { User } from "@/app/generated/prisma/client";

/**
 * Query parameters used by the Admin player-management list.
 *
 * Identity is intentionally not part of the query. The caller is already
 * authorized as an Admin before this query reaches the repository.
 */
export interface PlayerSearchQuery {
  /**
   * Optional case-insensitive search against the player's searchable
   * identity fields.
   */
  readonly search?: string;

  /**
   * Optional player-status filter.
   */
  readonly status?: UserStatus;

  /**
   * One-based page number.
   */
  readonly page: number;

  /**
   * Number of players returned per page.
   */
  readonly pageSize: number;
}

/**
 * Result returned by the player-management repository when listing players.
 *
 * passwordHash is intentionally excluded because player-management reads
 * must never expose password hashes beyond the persistence boundary.
 */
export interface PlayerSearchResult {
  readonly rows: readonly Omit<User, "passwordHash">[];

  /**
   * Total number of players matching the filters, before pagination.
   */
  readonly total: number;
}
