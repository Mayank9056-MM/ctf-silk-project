import type { UserStatus } from "@/app/generated/prisma/enums";

// player-management.dto.ts

/**
 * One player, as an admin views or searches for them.
 *
 * Built from Omit<User, "passwordHash"> — the exact shape both
 * findPlayerById and searchPlayers already return — with every field
 * below chosen because Player Management specifically needs it, not
 * because it happened to exist on the row. See this file's header for
 * the full reasoning behind each excluded field.
 */
export interface PlayerDTO {
  readonly id: string;

  readonly fullName: string;
  readonly username: string;
  readonly email: string;

  /**
   * The field ban/unban actually operates on, and what
   * PlayerSearchQuery.status filters by.
   */
  readonly status: UserStatus;

  /**
   * Brute-force protection state — directly relevant context for a
   * player-management decision (e.g. "is this account locked because
   * of a real attack, or about to self-resolve").
   */
  readonly failedLoginAttempts: number;
  readonly lockedUntil: Date | null;

  readonly lastLoginAt: Date | null;

  /** When this player registered. */
  readonly createdAt: Date;
}

/**
 * Paginated player search result returned to the admin client.
 *
 * Flat shape (`players`, `total`, `page`, `pageSize`, `totalPages`)
 * matches the identical convention AnnouncementListDTO and
 * NotificationListDTO both independently use — there is no shared
 * generic pagination type anywhere in this codebase to reuse instead
 * (checked both files directly before defining this).
 */
export interface PlayerListDTO {
  readonly players: readonly PlayerDTO[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
