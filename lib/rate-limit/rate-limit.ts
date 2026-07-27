import prisma from "@/lib/prisma";

export interface RateLimitConfig {
  action: string;
  identifier: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Fixed-window counter — atomic insert-or-increment, same idiom as
 * LeaderboardEntry's upsertForSolve. Fixed windows (not a sliding log)
 * are a deliberate simplification: a client could in theory get up to
 * ~2x the nominal limit by timing requests around a boundary. Acceptable
 * here because this is always defense-in-depth alongside a substantive
 * check (account lockout, unique constraints, flag hashing) — never the
 * sole thing standing between a request and a real problem.
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const windowNumber = Math.floor(Date.now() / config.windowMs);
  const key = `${config.action}:${config.identifier}:${windowNumber}`;
  const resetAt = new Date((windowNumber + 1) * config.windowMs);

  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "rate_limit_buckets" ("key", "count", "expiresAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = "rate_limit_buckets"."count" + 1
      RETURNING "count"
    `;

    const count = rows[0]?.count ?? 1;

    return {
      allowed: count <= config.limit,
      remaining: Math.max(0, config.limit - count),
      resetAt,
    };
  } catch (error) {
    // Fail OPEN, not closed. A transient DB hiccup rejecting every
    // request during a live event is a worse outcome than briefly
    // losing this one defense-in-depth layer while it's investigated.
    console.error(`[rate-limit] check failed for "${key}", failing open:`, error);
    return { allowed: true, remaining: config.limit, resetAt };
  }
}

/**
 * Not wired to a scheduler — this table stays tiny for a single
 * few-hour event. A manual call (or a cron hitting it hourly) is more
 * than enough; correctness of checkRateLimit never depends on old
 * windows being cleaned up.
 */
export async function cleanupExpiredRateLimitBuckets(): Promise<number> {
  const result = await prisma.rateLimitBucket.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}