// create-notification.schema.ts

import { z } from "zod";
import {
  NotificationType,
  NotificationPriority,
  NotificationResourceType,
} from "@/app/generated/prisma/enums";
import { NOTIFICATION_LIMITS } from "../constants/notification.constants";

export const createNotificationSchema = z
  .object({
    /**
     * The recipient — whose inbox this notification is delivered to. The
     * notification's target, not the admin creating it. Trimmed before the
     * length check, so a whitespace-only id is rejected as blank.
     */
    userId: z.string().trim().min(1, "A recipient is required."),

    /**
     * The notification's category, validated against the real
     * NotificationType Prisma enum (ANNOUNCEMENT / EVENT / SECURITY /
     * SYSTEM).
     */
    type: z.enum(NotificationType),

    /**
     * Urgency level, validated against the real NotificationPriority
     * Prisma enum (LOW / NORMAL / HIGH / CRITICAL).
     */
    priority: z.enum(NotificationPriority),

    /**
     * The notification's headline. Trimmed before the length check, so a
     * whitespace-only title is rejected as empty rather than accepted as a
     * title full of invisible characters.
     */
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(
        NOTIFICATION_LIMITS.TITLE_MAX_LENGTH,
        `Title must not exceed ${NOTIFICATION_LIMITS.TITLE_MAX_LENGTH} characters.`,
      ),

    /**
     * The notification's body. Same trim-then-check treatment as title.
     */
    message: z
      .string()
      .trim()
      .min(1, "Message is required.")
      .max(
        NOTIFICATION_LIMITS.MESSAGE_MAX_LENGTH,
        `Message must not exceed ${NOTIFICATION_LIMITS.MESSAGE_MAX_LENGTH} characters.`,
      ),

    /**
     * Optional deep-link target kind. Validated against the real
     * NotificationResourceType Prisma enum (ANNOUNCEMENT / EVENT). Must be
     * supplied together with resourceId or not at all — see the
     * superRefine below.
     */
    resourceType: z.enum(NotificationResourceType).optional(),

    /**
     * Optional deep-link target id. Trimmed before the length check when
     * present. Must be supplied together with resourceType or not at all.
     */
    resourceId: z.string().trim().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    const hasType = data.resourceType !== undefined;
    const hasId = data.resourceId !== undefined;

    if (hasType !== hasId) {
      ctx.addIssue({
        code: "custom",
        message:
          "Both a resource type and a resource id are required to link a notification to something — or neither.",
        path: hasType ? ["resourceId"] : ["resourceType"],
      });
    }
  });

/**
 * The validated, trimmed shape a Server Action passes into
 * notificationService.createNotification() as its `input` argument
 * (alongside the actor, resolved separately). Structurally compatible
 * with CreateNotificationInput — every field validated here matches that
 * type exactly.
 */
export type CreateNotificationSchema = z.infer<typeof createNotificationSchema>;
