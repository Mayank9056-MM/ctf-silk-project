// get-notifications.schema.ts

import { z } from "zod";
import { NOTIFICATION_PAGINATION } from "../constants/notification.constants";

// get-notifications.schema.ts

export const getNotificationsSchema = z.object({
  /**
   * Which page of results to return, 1-indexed. Optional — an omitted
   * page defaults to the first page.
   */
  page: z.coerce
    .number()
    .int()
    .positive("Page must be greater than zero.")
    .default(1),

  /**
   * How many notifications to return per page. Optional — an omitted
   * pageSize defaults to NOTIFICATION_PAGINATION.DEFAULT_PAGE_SIZE.
   * Capped at MAX_PAGE_SIZE regardless of what's requested.
   */
  pageSize: z.coerce
    .number()
    .int()
    .positive("Page size must be greater than zero.")
    .max(
      NOTIFICATION_PAGINATION.MAX_PAGE_SIZE,
      `Page size cannot exceed ${NOTIFICATION_PAGINATION.MAX_PAGE_SIZE}.`,
    )
    .default(NOTIFICATION_PAGINATION.DEFAULT_PAGE_SIZE),
});

/**
 * The validated, defaulted shape a Server Action passes into
 * notificationService.getNotifications(actor, query) as its `query`
 * argument. Structurally compatible with NotificationListQuery — both
 * page and pageSize are guaranteed concrete numbers here, never undefined.
 */
export type GetNotificationsSchema = z.infer<typeof getNotificationsSchema>;
