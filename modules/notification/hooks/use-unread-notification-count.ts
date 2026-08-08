"use client";

import { useQuery } from "@tanstack/react-query";
import type { UnreadNotificationCountDTO } from "../types/notification.dto";
import { notificationKeys } from "../constants/notification.keys";
import { getUnreadNotificationCount } from "../actions/get-unread-notification-count";

export function useUnreadNotificationCount() {
  return useQuery<UnreadNotificationCountDTO>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => getUnreadNotificationCount(),
    staleTime: 30_000,
  });
}
