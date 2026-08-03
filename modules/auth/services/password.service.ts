import { env } from "@/config/env";
import argon2 from "argon2";

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
}

export const passwordService = new PasswordService();
