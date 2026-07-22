import { cookies } from "next/headers";

import { accessTokenService, type AccessTokenPayload } from "@/modules/auth/services/access-token.service";
import { AUTH_CONSTANTS } from "@/modules/auth/constants/auth.constants";

/**
 * Reads and verifies the access token cookie. Returns null for any failure
 * (missing, malformed, expired) — callers treat all three the same way:
 * "no verified user available for this render."
 */
export async function getCurrentUser(): Promise<AccessTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CONSTANTS.ACCESS_TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return accessTokenService.verifyAccessToken(token);
  } catch {
    return null;
  }
}