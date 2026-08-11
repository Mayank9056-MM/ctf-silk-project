// modules/dashboard/constants/dashboard.keys.ts

/**
 * The dashboard has exactly one query shape — a single authenticated
 * snapshot, no parameters — so this factory is deliberately minimal:
 * one root, one leaf. Matches announcementKeys/notificationKeys'
 * factory-function convention (`all` as the shared prefix, nested
 * builders extending it) without inventing structure this module has no
 * use for.
 */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
} as const;
