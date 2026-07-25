/**
 * Challenge difficulty levels.
 */
export const CHALLENGE_DIFFICULTY = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  EXPERT: 4,
  INSANE: 5,
} as const;

/**
 * Default values.
 */
export const DEFAULT_CHALLENGE_DIFFICULTY =
  CHALLENGE_DIFFICULTY.EASY;

export const DEFAULT_XP_REWARD = 100;

/**
 * Validation limits.
 */
export const MAX_CHALLENGE_TITLE_LENGTH = 150;

export const MAX_CHALLENGE_SLUG_LENGTH = 160;

export const MAX_FLAG_LENGTH = 255;

export const MAX_ATTACHMENT_FILE_NAME_LENGTH = 255;

export const MAX_ATTACHMENT_PATH_LENGTH = 500;