import {
  NotificationPriority,
  NotificationResourceType,
  NotificationType,
} from "@/app/generated/prisma/enums";

/**
 * Single notification returned to clients.
 */
export interface NotificationDTO {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;

  /**
   * Optional navigation target.
   *
   * If both fields are null, the notification is informational only
   * and does not navigate anywhere when opened.
   */
  resourceType: NotificationResourceType | null;

  resourceId: string | null;

  /**
   * NULL means unread.
   */
  readAt: Date | null;

  createdAt: Date;
}

/**
 * Paginated notification list.
 */
export interface NotificationListDTO {
  notifications: NotificationDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Returned when only the unread badge count is needed.
 */
export interface UnreadNotificationCountDTO {
  unreadCount: number;
}

/**
 * Response after creating a notification.
 */
export interface CreateNotificationDTO {
  notification: NotificationDTO;
}

/**
 * Response after marking a notification as read.
 */
export interface MarkNotificationAsReadDTO {
  notification: NotificationDTO;
}

/**
 * Response after marking every notification as read.
 */
export interface MarkAllNotificationsAsReadDTO {
  /**
   * Number of notifications transitioned from unread to read.
   */
  updatedCount: number;
}
