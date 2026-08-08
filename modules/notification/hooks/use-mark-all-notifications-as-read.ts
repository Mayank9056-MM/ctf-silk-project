"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MarkAllNotificationsAsReadDTO } from "../types/notification.dto";
import { markAllNotificationsAsRead } from "../actions/mark-all-notifications-as-read";
import { notificationKeys } from "../constants/notification.keys";

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation<MarkAllNotificationsAsReadDTO, Error, void>({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.details() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
}
