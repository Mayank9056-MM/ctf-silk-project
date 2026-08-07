import {
  Notification,
  NotificationPriority,
  NotificationType,
} from "@/app/generated/prisma/client";

/**
 * Notification with its recipient loaded.
 *
 * Used by repository methods that include the related User.
 * Keeping this as a named type avoids repeatedly spelling out the
 * Prisma intersection type throughout the module.
 */
export type NotificationWithUser = Notification & {
  user: {
    id: string;
    fullName: string;
  };
};

/**
 * Internal input required when creating a notification.
 *
 * The service constructs this after all authorization and business
 * rules have already been evaluated.
 */
export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;

  /**
   * Optional resource this notification points to.
   *
   * Examples
   *
   * ANNOUNCEMENT
   * EVENT
   */
  resourceType?: string;
  resourceId?: string;
}

/**
 * Pagination parameters for listing notifications.
 */
export interface NotificationListQuery {
  page: number;
  pageSize: number;
}

/**
 * Raw repository result.
 *
 * The repository returns the database rows together with the total count.
 * Derived presentation values such as totalPages belong in the mapper.
 */
export interface NotificationListResult {
  notifications: Notification[];

  total: number;
}
