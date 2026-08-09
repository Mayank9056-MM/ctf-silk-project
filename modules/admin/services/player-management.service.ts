// ============================================================================
// player-management.service.ts
// ============================================================================
//
// Admin-only player moderation: read, ban, unban, reset password.
//
// CONCURRENCY: ban/unban/password-reset all use a conditional UPDATE
// (userRepository.updateStatusIf / updatePasswordHashIf) rather than a
// plain findPlayerById()-then-update() sequence — see each method's own
// comment for the specific race it closes.
//
// AUDIT GUARANTEE (read before touching this file): auditService.record()
// catches its own database errors internally and returns null instead of
// throwing (see audit.service.ts). Calling record(tx, ...) inside a
// $transaction does NOT give "domain write rolls back if the audit write
// fails" semantics, because a swallowed error never propagates to the
// transaction callback. What IS guaranteed: the domain mutation and the
// refresh-token revocation are atomic with each other. The audit write is
// best-effort within that same transaction, not a guaranteed side effect
// of it. Do not restate this as "atomic audit trail" anywhere in this file.
// ============================================================================

import { UserStatus } from "@/app/generated/prisma/enums";
import type { User } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import { playerManagementLogger as log } from "@/lib/logger/logger.scopes";

import type { AuditActor } from "@/modules/audit/types/audit.types";
import * as auditService from "@/modules/audit/services/audit.service";

import {
  NotificationType,
  NotificationPriority,
} from "@/app/generated/prisma/enums";
import { notificationService } from "@/modules/notification/services/notification.service";

import { userRepository } from "@/modules/auth/repositories/user.repository";
import { refreshTokenRepository } from "@/modules/auth/repositories/refresh-token.repository";
import { passwordService } from "@/modules/auth/services/password.service";

import { assertCanAccessAdmin } from "../utils/admin-access";
import { playerManagementRepository } from "../repositories/player-management.repository";
import {
  toPlayerDTO,
  toPlayerListDTO,
} from "../utils/player-management.mapper";
import type { PlayerDTO, PlayerListDTO } from "../types/player-management.dto";
import type { PlayerSearchQuery } from "../types/player-management.types";

export interface ResetPlayerPasswordResult {
  readonly player: PlayerDTO;
  readonly temporaryPassword: string;
}

class PlayerManagementService {
  async getPlayer(actor: AuditActor, playerId: string): Promise<PlayerDTO> {
    assertCanAccessAdmin(actor);

    const player = await playerManagementRepository.findPlayerById(
      prisma,
      playerId,
    );
    if (!player) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Player not found.");
    }
    return toPlayerDTO(player);
  }

  async getPlayers(
    actor: AuditActor,
    query: PlayerSearchQuery,
  ): Promise<PlayerListDTO> {
    assertCanAccessAdmin(actor);

    const result = await playerManagementRepository.searchPlayers(
      prisma,
      query,
    );
    return toPlayerListDTO(result, query.page, query.pageSize);
  }

  /**
   * Bans a player. The initial findPlayerById()/status check exists only
   * to produce a clean, specific NOT_FOUND / "already banned" error for
   * the common case — it is NOT what makes this safe under concurrency.
   * Safety comes from updateStatusIf()'s conditional UPDATE inside the
   * transaction: if two admins race, the loser's updateStatusIf returns
   * false, the transaction throws before any audit/session-revocation
   * side effect runs, and the whole transaction rolls back — so a lost
   * race produces zero side effects, not a duplicate one.
   */
  async banPlayer(actor: AuditActor, playerId: string): Promise<PlayerDTO> {
    assertCanAccessAdmin(actor);

    const player = await playerManagementRepository.findPlayerById(
      prisma,
      playerId,
    );
    if (!player) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Player not found.");
    }
    if (player.status === UserStatus.BANNED) {
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "Player is already banned.",
      );
    }

    const transitioned = await prisma.$transaction(async (tx) => {
      const applied = await userRepository.updateStatusIf(
        tx,
        playerId,
        UserStatus.ACTIVE,
        UserStatus.BANNED,
      );
      if (!applied) return false;

      await refreshTokenRepository.revokeAllForUser(tx, playerId);

      // Best-effort within this transaction — see this file's header
      // for why a failed write here does not roll back the ban.
      await auditService.record(tx, {
        eventKey: "USER_BANNED",
        actor,
        resourceId: playerId,
        resourceName: player.username,
        success: true,
      });

      return true;
    });

    if (!transitioned) {
      log.warn("Ban lost a concurrency race — status already changed", {
        actorId: actor.actorId,
        playerId,
      });
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "This player's status changed concurrently. Refresh and try again.",
      );
    }

    log.info("Player banned", { actorId: actor.actorId, playerId });

    try {
      await notificationService.createNotification(actor, {
        userId: playerId,
        type: NotificationType.SECURITY,
        priority: NotificationPriority.HIGH,
        title: "Account banned",
        message:
          "Your account has been banned by an administrator. If you believe this is a mistake, please contact the event organizers.",
      });
    } catch (error) {
      log.error("Failed to create ban notification", error, { playerId });
    }

    return toPlayerDTO(withStatus(player, UserStatus.BANNED));
  }

  /** Unbans a player. Same conditional-update safety as banPlayer, reversed direction. No session revocation — restoring access has nothing to revoke. */
  async unbanPlayer(actor: AuditActor, playerId: string): Promise<PlayerDTO> {
    assertCanAccessAdmin(actor);

    const player = await playerManagementRepository.findPlayerById(
      prisma,
      playerId,
    );
    if (!player) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Player not found.");
    }
    if (player.status !== UserStatus.BANNED) {
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "Player is not currently banned.",
      );
    }

    const transitioned = await prisma.$transaction(async (tx) => {
      const applied = await userRepository.updateStatusIf(
        tx,
        playerId,
        UserStatus.BANNED,
        UserStatus.ACTIVE,
      );
      if (!applied) return false;

      await auditService.record(tx, {
        eventKey: "USER_UNBANNED",
        actor,
        resourceId: playerId,
        resourceName: player.username,
        success: true,
      });

      return true;
    });

    if (!transitioned) {
      log.warn("Unban lost a concurrency race — status already changed", {
        actorId: actor.actorId,
        playerId,
      });
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "This player's status changed concurrently. Refresh and try again.",
      );
    }

    log.info("Player unbanned", { actorId: actor.actorId, playerId });

    try {
      await notificationService.createNotification(actor, {
        userId: playerId,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.NORMAL,
        title: "Account restored",
        message: "Your account access has been restored by an administrator.",
      });
    } catch (error) {
      log.error("Failed to create unban notification", error, { playerId });
    }

    return toPlayerDTO(withStatus(player, UserStatus.ACTIVE));
  }

  /**
   * Resets a player's password. The temporary password is only ever
   * returned if updatePasswordHashIf() confirms the row's
   * passwordChangedAt was still what we read moments earlier — if a
   * concurrent reset won the race, that check fails, the transaction
   * returns false, and this method throws a conflict WITHOUT returning
   * any temporary password. This is what guarantees the admin never
   * receives a temp password that is no longer the stored credential —
   * the exact failure mode flagged in the original requirements.
   *
   * Plaintext exists only as a local `temporaryPassword` variable
   * between generation and (a) hashing, (b) the single return value.
   * It is never logged, never passed to auditService (no metadata is
   * populated on the audit call), and never included in the
   * notification body sent to the player.
   */
  async resetPlayerPassword(
    actor: AuditActor,
    playerId: string,
  ): Promise<ResetPlayerPasswordResult> {
    assertCanAccessAdmin(actor);

    const player = await playerManagementRepository.findPlayerById(
      prisma,
      playerId,
    );
    if (!player) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Player not found.");
    }

    const temporaryPassword = passwordService.generateTemporaryPassword();
    const passwordHash = await passwordService.hash(temporaryPassword);

    const transitioned = await prisma.$transaction(async (tx) => {
      const applied = await userRepository.updatePasswordHashIf(
        tx,
        playerId,
        player.passwordChangedAt,
        passwordHash,
      );
      if (!applied) return false;

      await refreshTokenRepository.revokeAllForUser(tx, playerId);

      await auditService.record(tx, {
        eventKey: "PASSWORD_RESET_COMPLETED",
        actor,
        resourceId: playerId,
        resourceName: player.username,
        success: true,
      });

      return true;
    });

    if (!transitioned) {
      log.warn("Password reset lost a concurrency race — not applied", {
        actorId: actor.actorId,
        playerId,
      });
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "This player's password was changed by another operation at the same time. Please try again.",
      );
    }

    log.info("Player password reset by admin", {
      actorId: actor.actorId,
      playerId,
    });

    try {
      await notificationService.createNotification(actor, {
        userId: playerId,
        type: NotificationType.SECURITY,
        priority: NotificationPriority.HIGH,
        title: "Your password was reset",
        message:
          "An administrator reset your password. Please contact the event organizers to receive your new temporary password, and change it after logging in.",
      });
    } catch (error) {
      log.error("Failed to create password-reset notification", error, {
        playerId,
      });
    }

    // No field on PlayerDTO reflects passwordChangedAt, so the
    // pre-reset `player` object is still an accurate DTO source —
    // nothing PlayerDTO-visible changed.
    return { player: toPlayerDTO(player), temporaryPassword };
  }
}

/** Local, non-persisted status override for building a post-mutation DTO without a second database read. */
function withStatus(
  player: Omit<User, "passwordHash">,
  status: UserStatus,
): Omit<User, "passwordHash"> {
  return { ...player, status };
}

export const playerManagementService = new PlayerManagementService();
