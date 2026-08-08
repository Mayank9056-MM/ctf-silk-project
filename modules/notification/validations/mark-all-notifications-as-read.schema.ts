// mark-all-notifications-as-read.schema.ts

import { z } from "zod";

// mark-all-notifications-as-read.schema.ts

export const markAllNotificationsAsReadSchema = z.object({});

/**
 * The validated shape a Server Action passes into
 * notificationService.markAllNotificationsAsRead() — an empty object,
 * since the operation needs nothing beyond the actor resolved separately
 * from the authenticated session.
 */
export type MarkAllNotificationsAsReadSchema = z.infer<
  typeof markAllNotificationsAsReadSchema
>;
