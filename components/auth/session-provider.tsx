"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { refreshSessionAction } from "@/modules/auth/actions/refresh-session";
import { AUTH_CONSTANTS } from "@/modules/auth/constants/auth.constants";

const REFRESH_SAFETY_MARGIN_MS = 60_000;
const REFRESH_INTERVAL_MS = AUTH_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS * 1000 - REFRESH_SAFETY_MARGIN_MS;
const LOCK_NAME = "sr-session-refresh-lock";
const CHANNEL_NAME = "sr-session-refresh-channel";

/**
 * Silently rotates the refresh token shortly before each access token
 * expires, for as long as a protected tab stays open. Mount once around
 * the protected route tree.
 *
 * Two mechanisms handle multi-tab usage — refreshSessionAction rotates the
 * refresh token on every call, and a revoked/already-rotated token forces a
 * full logout (see that action's own docs), so uncoordinated tabs can race
 * each other into an unnecessary sign-out:
 *
 *   - Web Locks API (navigator.locks) makes concurrent tabs queue instead
 *     of racing. Falls back to no locking on unsupported browsers — worst
 *     case is an occasional forced re-login rather than a broken feature.
 *   - BroadcastChannel restarts every tab's countdown after any tab
 *     refreshes, so tabs fall into sync and stop firing near each other
 *     after the first coordinated refresh.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const inFlight = useRef(false);

  useEffect(() => {
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;
    let timeoutId: ReturnType<typeof setTimeout>;

    function schedule(delay = REFRESH_INTERVAL_MS) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(refresh, delay);
    }

    async function performRefresh() {
      inFlight.current = true;
      try {
        const result = await refreshSessionAction();
        if (result.success) {
          channel?.postMessage("refreshed");
        } else if (result.requiresReauth) {
          router.replace("/login");
          return;
        }
      } finally {
        inFlight.current = false;
      }
      schedule();
    }

    async function refresh() {
      if (inFlight.current) return;
      if (typeof navigator !== "undefined" && "locks" in navigator) {
        await navigator.locks.request(LOCK_NAME, performRefresh);
      } else {
        await performRefresh();
      }
    }

    function onChannelMessage(event: MessageEvent) {
      if (event.data === "refreshed") schedule();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }

    channel?.addEventListener("message", onChannelMessage);
    document.addEventListener("visibilitychange", onVisibilityChange);
    schedule();

    return () => {
      clearTimeout(timeoutId);
      channel?.removeEventListener("message", onChannelMessage);
      channel?.close();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return <>{children}</>;
}