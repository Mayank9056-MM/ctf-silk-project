import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import { eventService } from "@/modules/event/services/event.service";
import { eventRepository } from "@/modules/event/repositories/event.repository";

import { leaderboardLogger as log } from "@/lib/logger/logger.scopes";
import { record } from "@/modules/audit/services/audit.service";
import type { AuditActor } from "@/modules/audit/types/audit.types";

import { leaderboardRepository } from "../repositories/leaderboard.repository";
import { LeaderboardScope } from "../types/leaderboard.enums";
import type { UserRankResult } from "../types/leaderboard.types";
import {
  toLeaderboardDTO,
  toUserRankDTO,
  toAdminLeaderboardDTO,
} from "../utils/leaderboard.mapper";
import type {
  LeaderboardDTO,
  UserRankDTO,
  AdminLeaderboardDTO,
} from "../types/leaderboard.dto";

/**
 * Owns every read path plus freeze/unfreeze. Does NOT own writing a solve
 * into LeaderboardEntry — that's leaderboardRepository.upsertForSolve,
 * called directly by SubmissionService inside its own transaction.
 * Routing that write through this service would mean either opening a
 * second, separate transaction (breaking the atomicity the whole
 * Submission/ChallengeSolve/LeaderboardEntry write depends on) or this
 * service silently only working when called from inside someone else's
 * transaction — neither is worth it. Every method here uses `prisma`
 * directly for that reason: nothing here is meant to participate in a
 * caller's transaction.
 */
class LeaderboardService {
  async getLeaderboard(
    page: number,
    pageSize: number,
  ): Promise<LeaderboardDTO> {
    const { scope, frozenAt } = await this.resolveScope();

    if (scope === LeaderboardScope.FROZEN && frozenAt) {
      const { rows, totalCount } =
        await leaderboardRepository.findFrozenEntries(
          prisma,
          frozenAt,
          page,
          pageSize,
        );
      return toLeaderboardDTO(rows, scope, page, pageSize, totalCount);
    }

    const { rows, totalCount } = await leaderboardRepository.findLiveEntries(
      prisma,
      page,
      pageSize,
    );
    return toLeaderboardDTO(rows, scope, page, pageSize, totalCount);
  }

  /** The authenticated caller's own rank. */
  async getMyRank(userId: string): Promise<UserRankDTO> {
    return this.resolveRank(userId);
  }

  /** Same lookup for an arbitrary player — e.g. a public profile view. */
  async getUserRank(userId: string): Promise<UserRankDTO> {
    return this.resolveRank(userId);
  }

  /**
   * Always the live table, regardless of Event.leaderboardFrozenAt.
   * leaderboardFrozenAt is still returned (so the admin UI can show
   * "frozen since X"), but it never filters these rows the way it does
   * for players — see the mapper's toAdminLeaderboardDTO comment.
   */
  async getAdminLeaderboard(
    page: number,
    pageSize: number,
  ): Promise<AdminLeaderboardDTO> {
    const event = await eventService.getEvent(prisma);
    const { rows, totalCount } = await leaderboardRepository.findAdminEntries(
      prisma,
      page,
      pageSize,
    );
    return toAdminLeaderboardDTO(
      rows,
      page,
      pageSize,
      totalCount,
      event.leaderboardFrozenAt,
    );
  }

  /**
   * Freezes standings as of right now. Requires the event to have
   * actually started (freezing before anyone could have solved anything
   * is meaningless) and rejects if already frozen — a double-click can't
   * silently move the freeze point forward without an explicit unfreeze
   * first.
   */
  async freezeLeaderboard(actor: AuditActor): Promise<void> {
    const event = await eventService.getEvent(prisma);
    const access = await eventService.getEventAccess(prisma);

    if (!access.hasStarted) {
      log.warn("Leaderboard freeze rejected — event has not started", {
        actorId: actor.actorId,
      });
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "Cannot freeze the leaderboard before the event has started.",
      );
    }
    if (event.leaderboardFrozenAt) {
      log.warn("Leaderboard freeze rejected — already frozen", {
        actorId: actor.actorId,
        frozenAt: event.leaderboardFrozenAt,
      });

      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "The leaderboard is already frozen.",
      );
    }

    const frozenAt = new Date();

    try {
      await eventRepository.update(prisma, { leaderboardFrozenAt: new Date() });
    } catch (error) {
      log.error("Failed to persist leaderboard freeze", error, {
        actorId: actor.actorId,
      });
      throw error;
    }

    log.info("Leaderboard frozen", { actorId: actor.actorId, frozenAt });

    await record(prisma, {
      eventKey: "LEADERBOARD_FROZEN",
      actor,
      success: true,
      resourceName: "Leaderboard",
      metadata: { frozenAt: frozenAt.toISOString() },
    });
  }

  async unfreezeLeaderboard(actor: AuditActor): Promise<void> {
    const event = await eventService.getEvent(prisma);

    if (!event.leaderboardFrozenAt) {
      log.warn("Leaderboard unfreeze rejected — not currently frozen", {
        actorId: actor.actorId,
      });

      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "The leaderboard is not currently frozen.",
      );
    }

    const previouslyFrozenAt = event.leaderboardFrozenAt;

    try {
      await eventRepository.update(prisma, { leaderboardFrozenAt: null });
    } catch (error) {
      log.error("Failed to persist leaderboard unfreeze", error, {
        actorId: actor.actorId,
      });
      throw error;
    }

    log.info("Leaderboard unfrozen", {
      actorId: actor.actorId,
      previouslyFrozenAt,
    });

    await record(prisma, {
      eventKey: "LEADERBOARD_UNFROZEN",
      actor,
      success: true,
      resourceName: "Leaderboard",
      metadata: { previouslyFrozenAt: previouslyFrozenAt.toISOString() },
    });
  }

  /**
   * The single place deciding LIVE vs FROZEN for every player-facing
   * read. Reads Event fresh every call — never cached — same "derive,
   * don't store" discipline as getEventAccess: a freeze toggled mid-event
   * must take effect on the very next request, not after some TTL.
   */
  private async resolveScope(): Promise<{
    scope: LeaderboardScope;
    frozenAt: Date | null;
  }> {
    const event = await eventService.getEvent(prisma);
    return event.leaderboardFrozenAt
      ? { scope: LeaderboardScope.FROZEN, frozenAt: event.leaderboardFrozenAt }
      : { scope: LeaderboardScope.LIVE, frozenAt: null };
  }

  private async resolveRank(userId: string): Promise<UserRankDTO> {
    const { scope, frozenAt } = await this.resolveScope();

    const lookup =
      scope === LeaderboardScope.FROZEN && frozenAt
        ? await leaderboardRepository.findFrozenRank(prisma, userId, frozenAt)
        : await leaderboardRepository.findLiveRank(prisma, userId);

    const result: UserRankResult = lookup
      ? { scope, ...lookup }
      : {
          scope,
          rank: null,
          totalXp: 0,
          solvedChallenges: 0,
          lastSolvedAt: null,
        };

    return toUserRankDTO(result);
  }
}

export const leaderboardService = new LeaderboardService();
