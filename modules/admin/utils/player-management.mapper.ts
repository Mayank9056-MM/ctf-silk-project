import type { User } from "@/app/generated/prisma/client";

import type { PlayerDTO, PlayerListDTO } from "../types/player-management.dto";
import type { PlayerSearchResult } from "../types/player-management.types";

type PlayerRow = Omit<User, "passwordHash">;

/**
 * The canonical mapper. toPlayerListDTO reuses this for every row
 * rather than duplicating field selection for the list case — same
 * discipline as toNotificationListDTO/toAnnouncementListDTO.
 */
export function toPlayerDTO(player: PlayerRow): PlayerDTO {
  return {
    id: player.id,
    fullName: player.fullName,
    username: player.username,
    email: player.email,
    status: player.status,
    failedLoginAttempts: player.failedLoginAttempts,
    lockedUntil: player.lockedUntil,
    lastLoginAt: player.lastLoginAt,
    createdAt: player.createdAt,
  };
}

/**
 * Maps a paginated repository result into the list response the admin
 * client renders. Every row goes through toPlayerDTO() — no separate
 * mapping logic for list items vs. a single read. totalPages is the
 * only derived value computed here; page/pageSize are echoed back as
 * received, not recalculated, since the repository's `total` combined
 * with the caller's own requested page size is already everything
 * needed — identical reasoning to toAnnouncementListDTO/
 * toNotificationListDTO, which take the same (result, page, pageSize)
 * shape for the same reason: neither PlayerSearchResult nor its
 * siblings carry page/pageSize themselves.
 */
export function toPlayerListDTO(
  result: PlayerSearchResult,
  page: number,
  pageSize: number,
): PlayerListDTO {
  return {
    players: result.rows.map(toPlayerDTO),
    total: result.total,
    page,
    pageSize,
    totalPages: Math.ceil(result.total / pageSize),
  };
}
