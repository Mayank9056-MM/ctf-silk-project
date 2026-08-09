import { env } from "@/config/env";
import argon2 from "argon2";
import { randomBytes } from "crypto";

import { authLogger as log } from "@/lib/logger/logger.scopes";

class PasswordService {
  /**
   * Hash a plain text password using Argon2id.
   */
  async hash(password: string): Promise<string> {
    try {
      return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: env.ARGON2_MEMORY_COST,
        timeCost: env.ARGON2_TIME_COST,
        parallelism: env.ARGON2_PARALLELISM,
      });
    } catch (error) {
      log.error("Password hashing failed", error, {
        memoryCost: env.ARGON2_MEMORY_COST,
        timeCost: env.ARGON2_TIME_COST,
        parallelism: env.ARGON2_PARALLELISM,
      });
      throw error;
    }
  }

  /**
   * Verify a plain text password against its hash.
   */
  async verify(password: string, passwordHash: string): Promise<boolean> {
    try {
      return argon2.verify(passwordHash, password);
    } catch (error) {
      log.error("Password verification threw — likely a malformed hash", error);
      throw error;
    }
  }

  /**
   * Check if an existing password hash should be upgraded.
   */
  async needsRehash(passwordHash: string): Promise<boolean> {
    try {
      return argon2.needsRehash(passwordHash, {
        memoryCost: env.ARGON2_MEMORY_COST,
        timeCost: env.ARGON2_TIME_COST,
        parallelism: env.ARGON2_PARALLELISM,
      });
    } catch (error) {
      log.error("needsRehash check threw — likely a malformed hash", error);
      throw error;
    }
  }

  /**
   * Generates a cryptographically secure temporary password for
   * admin-initiated resets. crypto.randomBytes, never Math.random() —
   * same primitive refreshTokenService.generate() already uses for
   * session tokens, applied here with a shorter byte length: 15 bytes
   * (120 bits of entropy) base64url-encodes to exactly 20 characters
   * with no padding (15 is divisible by 3), which is strong enough for
   * a one-time credential while still short enough for an admin to
   * relay to a player manually — refreshTokenService's 32 bytes is
   * calibrated for a machine-only session token, not a human-typed one.
   *
   * Returns plaintext to the immediate caller only. Never logs, never
   * persists — the caller is responsible for hashing via hash() before
   * any database write and for treating the return value as
   * single-display, non-audited data.
   */
  generateTemporaryPassword(): string {
    return randomBytes(15).toString("base64url");
  }
}

export const passwordService = new PasswordService();
