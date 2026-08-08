// notification.mapper.ts

import { Notification } from "@/app/generated/prisma/client";
import {
  CreateNotificationDTO,
  MarkAllNotificationsAsReadDTO,
  MarkNotificationAsReadDTO,
  NotificationDTO,
  NotificationListDTO,
  UnreadNotificationCountDTO,
} from "../types/notification.dto";
import { NotificationListResult } from "../types/notification.types";

/**
 * The canonical mapper. Every other function in this file reuses it —
 * this is the one place that decides exactly which fields of a raw
 * Notification row reach a client. userId is deliberately never
 * included: every repository read is already scoped to one user's own
 * notifications (see notification.repository.ts), so echoing the owner
 * back on every row would be redundant, not informative.
 */
export function toNotificationDTO(notification: Notification): NotificationDTO {
  return {
    id: notification.id,
    type: notification.type,
    priority: notification.priority,
    title: notification.title,
    message: notification.message,
    resourceType: notification.resourceType,
    resourceId: notification.resourceId,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

/**
 * Maps a paginated repository result into the list response a client
 * renders. Every item goes through toNotificationDTO() — no separate
 * mapping logic for list items vs. single reads. totalPages is the only
 * derived value this function computes; page/pageSize are echoed back
 * as received, not recalculated, since the repository's `total` count
 * combined with the caller's own requested page size is already
 * everything needed.
 */
export function toNotificationListDTO(
  result: NotificationListResult,
  page: number,
  pageSize: number,
): NotificationListDTO {
  return {
    notifications: result.notifications.map(toNotificationDTO),
    total: result.total,
    page,
    pageSize,
    totalPages: Math.ceil(result.total / pageSize),
  };
}

/** Wraps a newly created notification for the create path's response. */
export function toCreateNotificationDTO(
  notification: Notification,
): CreateNotificationDTO {
  return {
    notification: toNotificationDTO(notification),
  };
}

/** Wraps a freshly-read notification for the mark-as-read path's response. */
export function toMarkNotificationAsReadDTO(
  notification: Notification,
): MarkNotificationAsReadDTO {
  return {
    notification: toNotificationDTO(notification),
  };
}

/**
 * Wraps a bulk "mark all as read" result. Takes a bare count, not a
 * Notification — there is no single row this operation is "about," so
 * unlike every other mapper in this file, there is nothing to pass
 * through toNotificationDTO(). See this file's own header for why this
 * DTO's shape is deliberately different from the single-item mappers
 * above rather than an inconsistency to be reconciled with them.
 */
export function toMarkAllNotificationsAsReadDTO(
  updatedCount: number,
): MarkAllNotificationsAsReadDTO {
  return { updatedCount };
}

/** Wraps the unread badge count. Same reasoning as the bulk-mark mapper above — a count is the entire answer, nothing to route through toNotificationDTO(). */
export function toUnreadNotificationCountDTO(
  unreadCount: number,
): UnreadNotificationCountDTO {
  return { unreadCount };
}
