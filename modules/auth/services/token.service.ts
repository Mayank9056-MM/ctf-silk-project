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
   * Generate a long lived refresh token
   */
  generateRefreshToken(payload: Pick<AccessTokenPayload, "userId">): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    } satisfies SignOptions);
  }

  /**
   * Verify an access token.
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  }

  /**
   * Verify a refresh token.
   */
  verifyRefreshToken(token: string): Pick<AccessTokenPayload, "userId"> {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as Pick<
      AccessTokenPayload,
      "userId"
    >;
  }
}

export const tokenService = new TokenService();
