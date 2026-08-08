"use client";

import { useQuery } from "@tanstack/react-query";
import type { NotificationDTO } from "../types/notification.dto";
import { notificationKeys } from "../constants/notification.keys";
import { getNotification } from "../actions/get-notification";

export function useNotification(id: string | undefined | null) {
  return useQuery<NotificationDTO>({
    queryKey: notificationKeys.detail(id ?? ""),
    queryFn: () => getNotification({ id }),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}