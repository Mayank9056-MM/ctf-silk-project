import { createHash, randomBytes } from "crypto";
import { AUTH_CONSTANTS } from "../constants/auth.constants";

class RefreshTokenService {
  /**
   * Generates a cryptographically secure refresh token.
   */
  generate(): string {
    return randomBytes(32).toString("base64url");
  }

  /**
   * Returns the SHA-256 hash of a refresh token.
   */
  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  generateExpiryDate(): Date {
    return new Date(
      Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_TTL_SECONDS * 24 * 60 * 60 * 1000,
    );
  }
}

export const refreshTokenService = new RefreshTokenService();
