// get-notification.schema.ts

import { z } from "zod";

export const getNotificationSchema = z.object({
  /**
   * Identifies which notification to retrieve. The only field this
   * operation needs. Trimmed before the length check, so a
   * whitespace-only id is rejected as blank rather than passed through as
   * a technically-non-empty string that could never match a real
   * notification anyway.
   *
   * Only shape is validated here — a non-empty string after trimming.
   * Whether a row with this id exists, and whether it belongs to the
   * requesting actor, are both resolved in
   * notification.service.ts's getNotification(), never here.
   */
  id: z.string().trim().min(1, "Notification id is required."),
});

/**
 * The validated shape a Server Action passes as the `id` argument into
 * notificationService.getNotification(actor, id) — actor is resolved
 * separately from the authenticated session, never part of this schema's
 * output.
 */
export type GetNotificationSchema = z.infer<typeof getNotificationSchema>;
