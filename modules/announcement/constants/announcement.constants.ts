// announcement.constants.ts

export const ANNOUNCEMENT_LIMITS = {
  /**
   * Maximum allowed announcement title length.
   *
   * Mirrors:
   *
   *   title String @db.VarChar(150)
   */
  TITLE_MAX_LENGTH: 150,

  /**
   * Maximum announcement body length.
   *
   * This is a product constraint rather than a database limitation.
   * Announcements are intended to be concise operational broadcasts,
   * not long-form documents.
   */
  MESSAGE_MAX_LENGTH: 1000,
} as const;

/**
 * Shared pagination configuration.
 *
 * Used by list endpoints and React Query hooks to ensure consistent
 * paging behaviour throughout the application.
 */
export const ANNOUNCEMENT_PAGINATION = {
  /**
   * Default number of announcements returned when no page size
   * is explicitly requested.
   */
  DEFAULT_PAGE_SIZE: 20,

  /**
   * Maximum page size accepted by the API.
   *
   * Prevents unbounded queries and protects the database from
   * unnecessarily large result sets.
   */
  MAX_PAGE_SIZE: 100,
} as const;
