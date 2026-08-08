"use client";

import { useQuery } from "@tanstack/react-query";
import { NOTIFICATION_PAGINATION } from "../constants/notification.constants";
import type { NotificationListDTO } from "../types/notification.dto";
import { notificationKeys } from "../constants/notification.keys";
import { getNotifications } from "../actions/get-notifications";

export function useNotifications(
  page: number = 1,
  pageSize: number = NOTIFICATION_PAGINATION.DEFAULT_PAGE_SIZE,
) {
  return useQuery<NotificationListDTO>({
    queryKey: notificationKeys.list(page, pageSize),
    queryFn: () => getNotifications({ page, pageSize }),
    staleTime: 30_000,
  });
}
