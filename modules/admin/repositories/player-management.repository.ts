import { Prisma, Role, User } from "@/app/generated/prisma/client";
import type { DbClient } from "@/lib/prisma";
import {
  PlayerSearchQuery,
  PlayerSearchResult,
} from "../types/player-management.types";

class PlayerManagementRepository {
  /**
   * A single player by id, with passwordHash omitted at the query
   * level. Returns null if the id doesn't exist OR belongs to a
   * non-player (SUPER_ADMIN) account — both cases are structurally
   * "not a player," and this method makes no distinction between them;
   * that's a service-layer 404-shaping decision, not this one's to make.
   */
  async findPlayerById(
    db: DbClient,
    id: string,
  ): Promise<Omit<User, "passwordHash"> | null> {
    return db.user.findFirst({
      where: { id, role: Role.USER },
      omit: { passwordHash: true },
    });
  }

  /**
   * Paginated, filtered, searchable player listing — the one operation
   * with no existing equivalent anywhere in userRepository.
   *
   * Deterministic ordering: createdAt desc with id asc as an explicit
   * tiebreaker, since createdAt alone could theoretically tie for
   * near-simultaneous registrations, which would otherwise make paged
   * results non-deterministic across requests.
   *
   * rows/total run via Promise.all, not a $transaction — matching
   * leaderboardRepository's own precedent for this exact shape of
   * query (a paginated admin list + count), not announcement's
   * stricter $transaction choice. A player list being momentarily
   * off-by-one from a concurrent signup mid-request is low-stakes and
   * cosmetic here, unlike the stronger consistency guarantee
   * Announcement's admin panel was built to need.
   */
  async searchPlayers(
    db: DbClient,
    query: PlayerSearchQuery,
  ): Promise<PlayerSearchResult> {
    const { search, status, page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      role: Role.USER,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { fullName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: pageSize,
        omit: { passwordHash: true },
      }),
      db.user.count({ where }),
    ]);

    return { rows, total };
  }
}

export const playerManagementRepository = new PlayerManagementRepository();
