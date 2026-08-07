// announcement.constants.ts

export const ANNOUNCEMENT_LIMITS = {
  TITLE_MAX_LENGTH: 150,
  MESSAGE_MAX_LENGTH: 1000,
} as const;

/**
 * Shared pagination configuration.
 *
 * Used by list endpoints and React Query hooks to ensure consistent
 * paging behaviour throughout the application.
 */
export const ANNOUNCEMENT_PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

if (
  ANNOUNCEMENT_PAGINATION.DEFAULT_PAGE_SIZE >
  ANNOUNCEMENT_PAGINATION.MAX_PAGE_SIZE
) {
  throw new Error(
    "[announcement.constants] ANNOUNCEMENT_PAGINATION.DEFAULT_PAGE_SIZE must not exceed ANNOUNCEMENT_PAGINATION.MAX_PAGE_SIZE.",
  );
}
