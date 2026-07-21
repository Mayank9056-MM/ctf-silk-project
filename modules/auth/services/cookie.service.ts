import { cookies } from "next/headers";

import { env } from "@/config/env";

class CookieService {
  private readonly accessTokenCookieName = "ctf_access_token";
  private readonly refreshTokenCookieName = "ctf_refresh_token";

  private readonly accessTokenMaxAge = 60 * 15; // 15 minutes
  private readonly refreshTokenMaxAge = 60 * 60 * 24 * 30; // 30 days

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
}

export const cookieService = new CookieService();
