// notification.service.ts

import type { Notification, Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import { notificationLogger as log } from "@/lib/logger/logger.scopes";

import type { AuditActor } from "@/modules/audit/types/audit.types";

import { notificationRepository } from "../repositories/notification.repository";
import {
  assertCanCreateNotification,
  assertNotificationOwner,
} from "../utils/notification-access";
import {
  toNotificationDTO,
  toNotificationListDTO,
  toCreateNotificationDTO,
  toMarkNotificationAsReadDTO,
  toMarkAllNotificationsAsReadDTO,
  toUnreadNotificationCountDTO,
} from "../utils/notification.mapper";
import type {
  CreateNotificationInput,
  NotificationListQuery,
} from "../types/notification.types";
import type {
  NotificationDTO,
  NotificationListDTO,
  CreateNotificationDTO,
  MarkNotificationAsReadDTO,
  MarkAllNotificationsAsReadDTO,
  UnreadNotificationCountDTO,
} from "../types/notification.dto";

// notification.service.ts

class NotificationService {
  /**
   * Creates a notification targeting a specific user. Administrative
   * operation — requires Permission.MANAGE_NOTIFICATIONS (see
   * notification-access.ts). The recipient (`input.userId`) is the
   * notification's TARGET, not the actor performing the creation; the two
   * are unrelated by design; CreateNotificationInput has no sender/creator
   * field at all (unlike Announcement's createdById), so there is nothing
   * here to silently derive from the actor — the actor is authorization
   * context only, never persisted onto the row.
   *
   * No audit event is recorded here. AUDIT_EVENTS has no
   * NOTIFICATION_CREATED entry today, and per this project's own governing
   * test for what belongs in AuditLog ("is this a decision someone might
   * need to justify months later, or already answerable from a
   * purpose-built table"), the Notification row itself already is that
   * record — the same reasoning that kept hint unlocks and per-solve
   * leaderboard upserts out of AuditLog. Adding one speculatively here
   * would be inventing an audit event with no registry entry behind it.
   */
  async createNotification(
    actor: AuditActor,
    input: CreateNotificationInput,
  ): Promise<CreateNotificationDTO> {
    assertCanCreateNotification(actor);

    let created: Notification;

    try {
      created = await notificationRepository.createNotification(prisma, input);
    } catch (error) {
      log.error("Unexpected error creating notification", error, {
        actorId: actor.actorId,
        targetUserId: input.userId,
      });
      throw error;
    }

    log.info("Notification created", {
      actorId: actor.actorId,
      notificationId: created.id,
      targetUserId: created.userId,
    });

    return toCreateNotificationDTO(created);
  }

  /**
   * Gets one notification, scoped to its owner. See
   * findOwnedNotificationOrThrow() below for the ownership-enforcement
   * detail shared with markNotificationAsRead().
   */
  async getNotification(
    actor: AuditActor,
    id: string,
  ): Promise<NotificationDTO> {
    const notification = await this.findOwnedNotificationOrThrow(actor, id);
    return toNotificationDTO(notification);
  }

  /**
   * Gets the authenticated actor's own paginated notifications. Scoped by
   * actor.actorId at the repository call — never by a client-supplied
   * userId, since NotificationListQuery (already validated upstream by
   * get-notifications.schema.ts) carries only page/pageSize, nothing
   * identity-related. There is no way for a caller to request another
   * user's list through this method's signature.
   */
  async getNotifications(
    actor: AuditActor,
    query: NotificationListQuery,
  ): Promise<NotificationListDTO> {
    const result = await notificationRepository.findNotifications(
      prisma,
      actor.actorId as string,
      query,
    );

    return toNotificationListDTO(result, query.page, query.pageSize);
  }

  /**
   * The unread badge count for the authenticated actor. Same actor-scoping
   * guarantee as getNotifications — no userId parameter exists on this
   * method's signature for a client to override.
   */
  async getUnreadNotificationCount(
    actor: AuditActor,
  ): Promise<UnreadNotificationCountDTO> {
    const unreadCount = await notificationRepository.countUnreadNotifications(
      prisma,
      actor.actorId as string,
    );

    return toUnreadNotificationCountDTO(unreadCount);
  }

  /**
   * Marks exactly one notification read, after confirming it belongs to
   * the actor. See findOwnedNotificationOrThrow() for why a missing row
   * and someone else's row produce the identical NOT_FOUND response.
   */
  async markNotificationAsRead(
    actor: AuditActor,
    id: string,
  ): Promise<MarkNotificationAsReadDTO> {
    await this.findOwnedNotificationOrThrow(actor, id);

    let updated: Notification;

    try {
      updated = await notificationRepository.markNotificationAsRead(prisma, id);
    } catch (error) {
      log.error("Unexpected error marking notification as read", error, {
        actorId: actor.actorId,
        notificationId: id,
      });
      throw error;
    }

    log.info("Notification marked as read", {
      actorId: actor.actorId,
      notificationId: id,
    });

    return toMarkNotificationAsReadDTO(updated);
  }
  
  /**
   * Marks every currently-unread notification belonging to the actor as
   * read, in one repository call. actor.actorId is the only identity this
   * method ever passes to the repository — there is no path for a client
   * to target another user's inbox through this operation.
   */
  async markAllNotificationsAsRead(
    actor: AuditActor,
  ): Promise<MarkAllNotificationsAsReadDTO> {
    try {
      const result: Prisma.BatchPayload =
        await notificationRepository.markAllNotificationsAsRead(
          prisma,
          actor.actorId as string,
        );

      log.info("All notifications marked as read", {
        actorId: actor.actorId,
        updatedCount: result.count,
      });

      return toMarkAllNotificationsAsReadDTO(result.count);
    } catch (error) {
      log.error("Failed to mark all notifications as read", {
        error,
        actorId: actor.actorId,
      });

      throw error;
    }
  }

  // --------------------------------------------------------------------
  // Private helpers — created only where reused across methods
  // --------------------------------------------------------------------

  /**
   * Reused by getNotification and markNotificationAsRead — both need the
   * identical "fetch, confirm it exists, confirm it's mine" sequence
   * before doing anything further.
   *
   * A JUDGMENT CALL WORTH STATING EXPLICITLY: assertNotificationOwner()
   * throws ApiError.forbidden() on a mismatch (see notification-access.ts's
   * own doc comment on why that's the technically accurate response for a
   * row confirmed to exist). This helper deliberately catches that
   * specific rejection and re-throws it as ApiError.notFound() instead.
   *
   * Why: a Forbidden response tells an attacker "this id exists, you're
   * just not allowed to see it" — a Not Found response reveals nothing.
   * For an admin-only resource like Announcement, that distinction barely
   * matters (assertCanManageAnnouncements is a role-wide gate, unrelated to
   * any specific row's existence). For a player-addressable-by-id resource
   * like Notification, it's a real IDOR consideration: a player probing
   * sequential or leaked notification ids should not be able to
   * distinguish "doesn't exist" from "exists, belongs to someone else" via
   * the response they get back. Translating the ownership rejection to
   * NOT_FOUND here — at the service boundary, after the access layer has
   * already made the real decision — closes that gap without changing
   * what notification-access.ts itself reports to any other caller that
   * might need the more precise Forbidden semantics later.
   */
  private async findOwnedNotificationOrThrow(
    actor: AuditActor,
    id: string,
  ): Promise<Notification> {
    const notification = await notificationRepository.findNotificationById(
      prisma,
      id,
    );

    if (!notification) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Notification not found.");
    }

    try {
      assertNotificationOwner(actor, notification);
    } catch (error) {
      if (error instanceof ApiError) {
        throw ApiError.notFound(ErrorCode.NOT_FOUND, "Notification not found.");
      }
      throw error;
    }

    return notification;
  }
}

export const notificationService = new NotificationService();
