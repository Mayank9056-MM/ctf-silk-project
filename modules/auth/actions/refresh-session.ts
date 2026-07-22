"use server";

import { authService } from "@/modules/auth/services/auth.service";
import { getRequestMetadata } from "@/modules/auth/utils/get-request-metadata";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import type { PublicUser } from "@/modules/auth/services/auth.service";

export type RefreshSessionResult =
  | { success: true; user: PublicUser }
  | {
      success: false;
      /**
       * True when the failure means "the user is fully signed out and must
       * re-authenticate" (expired, invalid, revoked, banned) — as opposed to
       * a transient failure where retrying might succeed. Callers use this
       * to decide whether to redirect to /login or just show a toast and
       * let the next interval/attempt try again.
       */
      requiresReauth: boolean;
      message: string;
    };

/**
 * Server Action that rotates the refresh token and mints a new access
 * token. Deliberately does NOT call redirect() — unlike loginAction, this
 * isn't tied to a form submission with a navigation outcome. It's meant to
 * be invoked programmatically:
 *
 *   - from a client-side interval/visibility-change handler that keeps the
 *     session alive before the access token expires, or
 *   - from a thin route/middleware wrapper on the first request after an
 *     access token is found to be expired.
 *
 * Callers own navigation. On `requiresReauth: true`, redirect to /login
 * client-side; on `false`, it's safe to leave the user where they are and
 * retry later.
 *
 * Concurrency note: refresh tokens rotate on every call (see
 * authService.refreshSession — old token is atomically replaced by a new
 * one in the same transaction). If this action fires from two tabs at
 * nearly the same time, the second call can race the first: by the time it
 * reads the refresh cookie, the token may already have been replaced,
 * producing REFRESH_TOKEN_REVOKED and forcing a full logout on an
 * otherwise legitimate session. If multi-tab usage is expected, the caller
 * should de-duplicate concurrent refresh attempts (e.g. a client-side
 * single-flight/mutex keyed on a BroadcastChannel or a shared promise)
 * rather than calling this action independently per tab.
 */
export async function refreshSessionAction(): Promise<RefreshSessionResult> {
  try {
    const user = await authService.refreshSession(await getRequestMetadata());
    return { success: true, user };
  } catch (error) {
    if (error instanceof ApiError) {
      const requiresReauth = [
        ErrorCode.SESSION_EXPIRED,
        ErrorCode.INVALID_REFRESH_TOKEN,
        ErrorCode.REFRESH_TOKEN_REVOKED,
        ErrorCode.REFRESH_TOKEN_EXPIRED,
        ErrorCode.ACCOUNT_BANNED,
      ].includes(error.code);

      return {
        success: false,
        requiresReauth,
        message: error.message,
      };
    }

    // Unexpected (DB down, etc.) — don't force a logout over a transient
    // infra failure; log for diagnosis and let the caller retry.
    console.error("[refreshSessionAction] unexpected error:", error);
    return {
      success: false,
      requiresReauth: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
