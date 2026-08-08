// notification.keys.ts

export const notificationKeys = {
  /**
   * The root of every Notification cache entry. Not queried directly —
   * exists so lists(), details(), and unreadCount() share one common
   * ancestor, keeping every key in this module under a single,
   * unambiguous namespace.
   */
  all: ["notifications"] as const,

  /**
   * The shared prefix for every paginated list query, regardless of
   * page or pageSize. A mutation hook invalidating this key catches
   * every cached list page at once, without needing to know which pages
   * a client currently has mounted.
   */
  lists: () => [...notificationKeys.all, "list"] as const,

  /**
   * One specific paginated list query — the exact key a
   * useNotifications(page, pageSize)-style query hook reads and writes.
   * Extends lists(), so invalidating lists() catches every list(...)
   * variant automatically via prefix matching.
   */
  list: (page: number, pageSize: number) =>
    [...notificationKeys.lists(), page, pageSize] as const,

  /**
   * The shared prefix for every single-notification query, regardless
   * of which id.
   */
  details: () => [...notificationKeys.all, "detail"] as const,

  /**
   * One specific notification by id — the exact key a
   * useNotification(id)-style query hook reads and writes.
   */
  detail: (id: string) => [...notificationKeys.details(), id] as const,

  /**
   * The unread badge count. No parameters — there is exactly one unread
   * count per authenticated user, resolved server-side, so there is
   * nothing here for a client to parameterize the key by.
   */
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
} as const;
