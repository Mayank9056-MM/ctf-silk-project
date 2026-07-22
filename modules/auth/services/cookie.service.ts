import { cookies } from "next/headers";

import { env } from "@/config/env";
import { AUTH_CONSTANTS } from "../constants/auth.constants";

class CookieService {
  private readonly accessTokenCookieName =
    AUTH_CONSTANTS.ACCESS_TOKEN_COOKIE_NAME;
  private readonly refreshTokenCookieName =
    AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME;

  private readonly accessTokenMaxAge = AUTH_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS;
  private readonly refreshTokenMaxAge =
    AUTH_CONSTANTS.REFRESH_TOKEN_TTL_SECONDS;

  private readonly baseCookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  /**
   * Set access token cookie.
   */
  async setAccessToken(token: string): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(this.accessTokenCookieName, token, {
      ...this.baseCookieOptions,
      maxAge: this.accessTokenMaxAge,
    });
  }

  /**
   * Set refresh token cookie.
   */
  async setRefreshToken(token: string): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(this.refreshTokenCookieName, token, {
      ...this.baseCookieOptions,
      maxAge: this.refreshTokenMaxAge,
    });
  }

  /**
   * Remove both authentication cookies.
   */
  async clearAuthCookies(): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.delete(this.accessTokenCookieName);
    cookieStore.delete(this.refreshTokenCookieName);
  }

  /**
   * Read the raw refresh token from the incoming request cookies.
   */
  async getRefreshToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(this.refreshTokenCookieName)?.value;
  }
}

export const cookieService = new CookieService();
