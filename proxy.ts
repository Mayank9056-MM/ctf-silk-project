// proxy.ts  (project root — Next.js 16's replacement for middleware.ts)

import { NextResponse, NextRequest } from "next/server";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

import { accessTokenService } from "@/modules/auth/services/access-token.service";
import { AUTH_CONSTANTS } from "@/modules/auth/constants/auth.constants";

const GUEST_ROUTES = ["/login", "/register"];
const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/profile",
  "/team",
  "/campaign",
  "/challenges",
  "/leaderboard",
  "/settings",
];

function isGuestRoute(pathname: string): boolean {
  return GUEST_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Returns true only for a currently-valid access token. Expired or
 * malformed tokens are treated identically to "no token" here — the proxy
 * doesn't distinguish *why* auth failed, it just gates the route. That
 * distinction (e.g. "your session expired, refreshing...") is a client-side
 * concern once past this layer.
 */
function hasValidAccessToken(request: NextRequest): boolean {
  const accessToken = request.cookies.get(
    AUTH_CONSTANTS.ACCESS_TOKEN_COOKIE_NAME,
  )?.value;

  if (!accessToken) return false;

  try {
    accessTokenService.verifyAccessToken(accessToken);
    return true;
  } catch (error) {
    if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
      return false;
    }
    // Unexpected verification error (e.g. misconfigured secret) — fail
    // closed rather than let a broken deployment silently admit everyone.
    console.error("[proxy] unexpected token verification error:", error);
    return false;
  }
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const authenticated = hasValidAccessToken(request);

  if (isProtectedRoute(pathname) && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestRoute(pathname) && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

/**
 * Matcher excludes Next internals and static assets so the proxy doesn't
 * run (and doesn't pay JWT-verification cost) on every JS chunk, font, and
 * favicon request. The negative lookahead keeps this to one pattern
 * instead of an ever-growing exclude list.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};