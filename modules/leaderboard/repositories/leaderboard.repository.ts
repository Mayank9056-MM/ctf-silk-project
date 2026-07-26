import type { DbClient } from "@/lib/prisma";
import type {
  LeaderboardEntryWithUser,
  AdminLeaderboardEntryWithUser,
  FrozenLeaderboardRow,
  RankLookupResult,
} from "../types/leaderboard.types";

/**
 * Shared ORDER BY, applied identically everywhere ranking happens — the
 * live findMany's orderBy array, and both raw-SQL ROW_NUMBER() queries
 * below. Keeping the tiebreak rule (XP desc, solve count desc, earliest
 * solve wins ties) defined in exactly one place, even split across two
 * query mechanisms, matters here: if the live and frozen paths ever
 * disagreed on sort order, a player's rank could visibly change purely
 * from the freeze happening, which would look like a bug even if neither
 * side is wrong on its own.
 */
const LIVE_ORDER_BY = [
  { totalXp: "desc" as const },
  { solvedChallenges: "desc" as const },
  { lastSolvedAt: "asc" as const },
];

class LeaderboardRepository {
  private readonly userSummary = {
    select: { id: true, username: true, fullName: true },
  } as const;

  private readonly adminUserSummary = {
    select: { id: true, username: true, fullName: true, email: true },
  } as const;

  // ============================================================
  // Live — reads LeaderboardEntry directly. Player-facing before a
  // freeze, and always the source for admin regardless of freeze state.
  // ============================================================

  async findLiveEntries(
    db: DbClient,
    page: number,
    pageSize: number,
  ): Promise<{ rows: LeaderboardEntryWithUser[]; totalCount: number }> {
    const [rows, totalCount] = await Promise.all([
      db.leaderboardEntry.findMany({
        orderBy: LIVE_ORDER_BY,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: this.userSummary },
      }),
      db.leaderboardEntry.count(),
    ]);

    return { rows, totalCount };
  }

  /**
   * Rank requires knowing a user's position in the FULL sort order, not
   * just whatever page they'd fall on — Prisma's query builder has no
   * window-function support, so this is raw SQL. Parameterized via the
   * tagged-template form; Prisma escapes ${userId} itself, this is not
   * string concatenation.
   */
  async findLiveRank(
    db: DbClient,
    userId: string,
  ): Promise<RankLookupResult | null> {
    const rows = await db.$queryRaw<
      {
        rank: bigint;
        totalXp: number;
        solvedChallenges: number;
        lastSolvedAt: Date | null;
      }[]
    >`
      SELECT rank, "totalXp", "solvedChallenges", "lastSolvedAt" FROM (
        SELECT
          "userId",
          "totalXp",
          "solvedChallenges",
          "lastSolvedAt",
          ROW_NUMBER() OVER (
            ORDER BY "totalXp" DESC, "solvedChallenges" DESC, "lastSolvedAt" ASC
          ) AS rank
        FROM "leaderboard_entries"
      ) ranked
      WHERE "userId" = ${userId}
    `;

    const row = rows[0];
    if (!row) return null;

    return {
      rank: Number(row.rank),
      totalXp: row.totalXp,
      solvedChallenges: row.solvedChallenges,
      lastSolvedAt: row.lastSolvedAt,
    };
  }

  // ============================================================
  // Admin — always live, regardless of Event.leaderboardFrozenAt. A
  // deliberately separate method from findLiveEntries rather than that
  // method plus an "includeEmail" flag — same reasoning as everywhere
  // else in this build: a structural difference (which method exists),
  // not a boolean anyone could pass wrong.
  // ============================================================

  async findAdminEntries(
    db: DbClient,
    page: number,
    pageSize: number,
  ): Promise<{ rows: AdminLeaderboardEntryWithUser[]; totalCount: number }> {
    const [rows, totalCount] = await Promise.all([
      db.leaderboardEntry.findMany({
        orderBy: LIVE_ORDER_BY,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: this.adminUserSummary },
      }),
      db.leaderboardEntry.count(),
    ]);

    return { rows, totalCount };
  }

  // ============================================================
  // Frozen — computed on the fly from ChallengeSolve, filtered to
  // solvedAt <= frozenAt. LeaderboardEntry only ever reflects "now," so
  // there is no cache to read here; at 10–15 challenges and a modest
  // player count this aggregation is cheap enough to run per request
  // with no materialized snapshot needed.
  // ============================================================

  async findFrozenEntries(
    db: DbClient,
    frozenAt: Date,
    page: number,
    pageSize: number,
  ): Promise<{ rows: FrozenLeaderboardRow[]; totalCount: number }> {
    const [rows, countResult] = await Promise.all([
      db.$queryRaw<
        {
          userId: string;
          username: string;
          fullName: string;
          totalXp: number;
          solvedChallenges: number;
          lastSolvedAt: Date;
        }[]
      >`
        SELECT
          cs."userId",
          u."username",
          u."fullName",
          SUM(cs."xpAwarded")::int AS "totalXp",
          COUNT(*)::int AS "solvedChallenges",
          MAX(cs."solvedAt") AS "lastSolvedAt"
        FROM "challenge_solves" cs
        JOIN "users" u ON u."id" = cs."userId"
        WHERE cs."solvedAt" <= ${frozenAt}
        GROUP BY cs."userId", u."username", u."fullName"
        ORDER BY "totalXp" DESC, "solvedChallenges" DESC, "lastSolvedAt" ASC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `,
      db.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT cs."userId")::bigint AS count
        FROM "challenge_solves" cs
        WHERE cs."solvedAt" <= ${frozenAt}
      `,
    ]);

    return { rows, totalCount: Number(countResult[0]?.count ?? 0) };
  }

  async findFrozenRank(
    db: DbClient,
    userId: string,
    frozenAt: Date,
  ): Promise<RankLookupResult | null> {
    const rows = await db.$queryRaw<
      {
        rank: bigint;
        totalXp: number;
        solvedChallenges: number;
        lastSolvedAt: Date;
      }[]
    >`
      SELECT rank, "totalXp", "solvedChallenges", "lastSolvedAt" FROM (
        SELECT
          cs."userId",
          SUM(cs."xpAwarded")::int AS "totalXp",
          COUNT(*)::int AS "solvedChallenges",
          MAX(cs."solvedAt") AS "lastSolvedAt",
          ROW_NUMBER() OVER (
            ORDER BY SUM(cs."xpAwarded") DESC, COUNT(*) DESC, MAX(cs."solvedAt") ASC
          ) AS rank
        FROM "challenge_solves" cs
        WHERE cs."solvedAt" <= ${frozenAt}
        GROUP BY cs."userId"
      ) ranked
      WHERE "userId" = ${userId}
    `;

    const row = rows[0];
    if (!row) return null;

    return {
      rank: Number(row.rank),
      totalXp: row.totalXp,
      solvedChallenges: row.solvedChallenges,
      lastSolvedAt: row.lastSolvedAt,
    };
  }

  // ============================================================
  // Write path — called from SubmissionService.submitFlag inside the
  // SAME transaction as the ChallengeSolve create. Raw SQL with an
  // upsert + GREATEST is the single-statement, no-retry-loop approach
  // from the model review: totalXp/solvedChallenges are atomic
  // increments, highestChapter/highestDisplayOrder need "max of current
  // vs. new," and ON CONFLICT DO UPDATE does all of it in one round trip
  // with no read-modify-write race window.
  // ============================================================

  async upsertForSolve(
    db: DbClient,
    params: {
      userId: string;
      xpAwarded: number;
      chapter: number;
      displayOrder: number;
      solvedAt: Date;
    },
  ): Promise<void> {
    const { userId, xpAwarded, chapter, displayOrder, solvedAt } = params;

    await db.$executeRaw`
      INSERT INTO "leaderboard_entries"
        ("userId", "totalXp", "solvedChallenges", "lastSolvedAt", "highestChapter", "highestDisplayOrder", "updatedAt")
      VALUES
        (${userId}, ${xpAwarded}, 1, ${solvedAt}, ${chapter}, ${displayOrder}, ${solvedAt})
      ON CONFLICT ("userId") DO UPDATE SET
        "totalXp" = "leaderboard_entries"."totalXp" + ${xpAwarded},
        "solvedChallenges" = "leaderboard_entries"."solvedChallenges" + 1,
        "lastSolvedAt" = ${solvedAt},
        "highestChapter" = GREATEST("leaderboard_entries"."highestChapter", ${chapter}),
        "highestDisplayOrder" = CASE
          WHEN ${chapter} > "leaderboard_entries"."highestChapter" THEN ${displayOrder}
          WHEN ${chapter} = "leaderboard_entries"."highestChapter"
            THEN GREATEST("leaderboard_entries"."highestDisplayOrder", ${displayOrder})
          ELSE "leaderboard_entries"."highestDisplayOrder"
        END,
        "updatedAt" = ${solvedAt}
    `;
  }
}

export const leaderboardRepository = new LeaderboardRepository();
