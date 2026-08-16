// modules/challenge/constants/challenge.keys.ts
export const challengeKeys = {
  all: ["challenges"] as const,

  /** Keyed by challengeId (cuid), not slug — see get-challenge.ts. */
  detail: (challengeId: string) => ["challenge", challengeId] as const,
};