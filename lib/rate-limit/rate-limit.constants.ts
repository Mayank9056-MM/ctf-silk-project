export const RATE_LIMITS = {
  // Identity-scoped — unaffected by how many people share a network.
  LOGIN_PER_EMAIL: { limit: 8, windowMs: 10 * 60 * 1000 },

  LOGIN_GLOBAL: { limit: 3000, windowMs: 60 * 1000 },
  REGISTER_GLOBAL: { limit: 500, windowMs: 60 * 1000 },
  SUBMIT_FLAG_GLOBAL: { limit: 5000, windowMs: 60 * 1000 },
  REFRESH_SESSION_GLOBAL: { limit: 5000, windowMs: 60 * 1000 },
} as const;