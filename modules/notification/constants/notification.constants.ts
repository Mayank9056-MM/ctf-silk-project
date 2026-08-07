// notification.constants.ts

/**
 * Character limits for notification content.
 *
 * These values are consumed by the Notification validation schemas and
 * mirror the database column definitions where applicable.
 */
export const NOTIFICATION_LIMITS = {
  /**
   * Maximum notification title length.
   *
   * Mirrors:
   *
   *   title String @db.VarChar(150)
   */
  TITLE_MAX_LENGTH: 150,

  /**
   * Maximum notification message length.
   *
   * The underlying Prisma column is `@db.Text`, so this is a product
   * constraint rather than a database limitation. Notifications should
   * remain concise and immediately understandable.
   */
  MESSAGE_MAX_LENGTH: 1000,
} as const;

/**
 * Shared pagination configuration.
 *
 * Used by notification list endpoints and React Query hooks to ensure
 * consistent paging behaviour across the application.
 */
export const NOTIFICATION_PAGINATION = {
  /**
   * Default number of notifications returned when no page size is
   * explicitly requested.
   */
  DEFAULT_PAGE_SIZE: 20,

  /**
   * Maximum page size accepted by the API.
   *
   * Prevents unnecessarily large queries while keeping polling
   * lightweight.
   */
  MAX_PAGE_SIZE: 100,
} as const;

if (
  NOTIFICATION_PAGINATION.DEFAULT_PAGE_SIZE >
  NOTIFICATION_PAGINATION.MAX_PAGE_SIZE
) {
  throw new Error(
    "[notification.constants] NOTIFICATION_PAGINATION.DEFAULT_PAGE_SIZE must not exceed NOTIFICATION_PAGINATION.MAX_PAGE_SIZE",
  );
}
