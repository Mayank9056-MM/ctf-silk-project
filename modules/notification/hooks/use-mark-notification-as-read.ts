"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MarkNotificationAsReadDTO } from "../types/notification.dto";
import type { MarkNotificationAsReadSchema } from "../validations/mark-notification-as-read.schema";
import { markNotificationAsRead } from "../actions/mark-notification-as-read";
import { notificationKeys } from "../constants/notification.keys";

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation<
    MarkNotificationAsReadDTO,
    Error,
    MarkNotificationAsReadSchema
  >({
    mutationFn: (input) => markNotificationAsRead(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
}
