import { env } from "@/config/env";
import argon2 from "argon2";

class PasswordService {
  /**
   * Hash a plain text password using Argon2id.
   */
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: env.ARGON2_MEMORY_COST,
      timeCost: env.ARGON2_TIME_COST,
      parallelism: env.ARGON2_PARALLELISM,
    });
  }

  /**
   * Verify a plain text password against its hash.
   */
  async verify(password: string, passwordHash: string): Promise<boolean> {
    return argon2.verify(passwordHash, password);
  }

  /**
   * Check if an existing password hash should be upgraded.
   */
  async needsRehash(passwordHash: string): Promise<boolean> {
    return argon2.needsRehash(passwordHash, {
      memoryCost: env.ARGON2_MEMORY_COST,
      timeCost: env.ARGON2_TIME_COST,
      parallelism: env.ARGON2_PARALLELISM,
    });
  }
}

export const passwordService = new PasswordService();
