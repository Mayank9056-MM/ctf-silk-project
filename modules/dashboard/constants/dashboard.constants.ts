// modules/dashboard/constants/dashboard.constants.ts

/**
 * Dashboard-specific presentation constants only — pagination/limit
 * values already owned by their respective modules (leaderboard page
 * size, notification page size, etc.) are never duplicated here; these
 * three exist solely to bound the SIZE of a dashboard PREVIEW, a concept
 * no other module has any reason to know about.
 */
export const DASHBOARD_CONSTANTS = {
  /** Rows shown in the dashboard's leaderboard preview widget. */
  LEADERBOARD_PREVIEW_SIZE: 5,
  /** Notifications shown in the dashboard's recent-activity preview. */
  NOTIFICATION_PREVIEW_SIZE: 5,
  /** Announcements shown in the dashboard's priority-bulletin preview. */
  ANNOUNCEMENT_PREVIEW_SIZE: 3,
} as const;