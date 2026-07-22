import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

import { env } from "@/config/env";
import { Role } from "@/app/generated/prisma/enums";

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  role: Role;
}

class TokenService {
  /**
   * Generate a short-lived access token.
   */
  generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    });
  }

  /**
   * Verify an access token.
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  }
}

export const tokenService = new TokenService();
