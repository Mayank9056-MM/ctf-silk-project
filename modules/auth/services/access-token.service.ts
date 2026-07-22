import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

import { env } from "@/config/env";
import { Role } from "@/app/generated/prisma/enums";
import { AUTH_CONSTANTS } from "../constants/auth.constants";

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  role: Role;
}

class AccessTokenService {
  /**
   * Generate a short-lived access token.
   */
  generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS as SignOptions["expiresIn"],
    });
  }

  /**
   * Verify an access token.
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  }
}

export const accessTokenService = new AccessTokenService();
