// player-management.constants.ts

/**
 * Limits used by the Admin Player Management module.
 *
 * Keep these values centralized so validation rules do not contain
 * scattered magic numbers.
 */
export const PLAYER_MANAGEMENT_LIMITS = {
  /**
   * Maximum length accepted for the player search query.
   */
  SEARCH_MAX_LENGTH: 100,

  /**
   * Maximum number of players returned in a single page.
   *
   * This protects the API and database from unnecessarily large
   * paginated queries.
   */
  PAGE_SIZE_MAX: 100,
} as const;