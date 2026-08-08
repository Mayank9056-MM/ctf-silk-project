"use client";

import { useMutation } from "@tanstack/react-query";
import type { CreateNotificationDTO } from "../types/notification.dto";
import type { CreateNotificationSchema } from "../validations/create-notification.schema";
import { createNotification } from "../actions/create-notification";

/**
 * Creates a notification through the server action.
 *
 * Authorization is enforced server-side by the Notification service.
 * No cache invalidation is performed because notification queries are
 * scoped to the authenticated browser session, while the recipient may
 * be a different user.
 */
export function useCreateNotification() {
  return useMutation<CreateNotificationDTO, Error, CreateNotificationSchema>({
    mutationFn: (input) => createNotification(input),
  });
}
