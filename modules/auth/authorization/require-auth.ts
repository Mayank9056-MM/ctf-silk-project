// modules/auth/authorization/require-auth.ts

import { cookies } from "next/headers";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

import { Role } from "@/app/generated/prisma/enums";
import { tokenService } from "@/modules/auth/services/access-token.service";
import { AUTH_CONSTANTS } from "@/modules/auth/constants/auth.constants";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

/**
 * The identity carried by a verified access token — deliberately narrower
 * than the Prisma `User` model. This is authentication's answer to "who is
 * this," not a user profile. Anything beyond userId/role (email, teamId,
 * avatar, etc.) means hitting the DB, which is explicitly out of scope
 * here — see the module comment below.
 */
export interface AuthenticatedUser {
  userId: string;
  role: Role;
}

/**
 * Reads and verifies the access token cookie, returning the authenticated
 * identity. This is the single chokepoint for "is there a valid JWT" —
 * every other authorization helper (requireRole, requirePermission) calls
 * this rather than re-reading cookies or re-verifying tokens themselves.
 *
 * Deliberately does NOT:
 *   - query the database (the JWT payload is the source of truth for
 *     userId/role within its own lifetime; if you need fresh user state —
 *     e.g. to check `status === "BANNED"` right now, not as of token
 *     issuance — that's a separate, explicit DB call the caller makes)
 *   - refresh an expired token (that's refreshSessionAction's job; a
 *     Server Component/Action that hits an expired token should fail
 *     closed and let the client trigger a refresh or redirect to login)
 *   - check role/permission (that's require-role.ts)
 *
 * Keeping it this narrow is what makes it cheap enough to call at the top
 * of every protected Server Component and Server Action without worrying
 * about N+1 DB hits or accidentally coupling authentication to whatever
 * authorization scheme exists this month.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(
    AUTH_CONSTANTS.ACCESS_TOKEN_COOKIE_NAME,
  )?.value;

  if (!accessToken) {
    throw ApiError.unauthorized(
      ErrorCode.UNAUTHORIZED,
      "You must be signed in to perform this action.",
    );
  }

  try {
    const payload = tokenService.verifyAccessToken(accessToken);
    return { userId: payload.userId, role: payload.role };
  } catch (error) {
    // Both branches map to INVALID_ACCESS_TOKEN: from the caller's
    // perspective "expired" and "tampered/malformed" require the same
    // response (re-authenticate), so there's no value in a separate code —
    // that distinction only matters for the log line, not the thrown error.
    if (error instanceof TokenExpiredError) {
      throw ApiError.unauthorized(
        ErrorCode.INVALID_ACCESS_TOKEN,
        "Your session has expired. Please sign in again.",
      );
    }
    if (error instanceof JsonWebTokenError) {
      console.error("[requireAuth] invalid access token:", error.message);
      throw ApiError.unauthorized(
        ErrorCode.INVALID_ACCESS_TOKEN,
        "Your session is no longer valid. Please sign in again.",
      );
    }
    throw error;
  }
}
