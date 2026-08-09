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
   * admin-initiated resets. Reuses the same randomBytes/base64url
   * approach already established by refreshTokenService.generate() —
   * not a new convention, the existing one applied to a new caller.
   * Returns plaintext; the caller (player-management.service.ts) is
   * responsible for hashing it via hash() before persistence and for
   * treating the return value as single-display, never-logged data.
   */
  generateTemporaryPassword(length = 16): string {
    return randomBytes(length).toString("base64url").slice(0, length);
  }
}

export const passwordService = new PasswordService();
