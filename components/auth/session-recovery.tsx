"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { refreshSessionAction } from "@/modules/auth/actions/refresh-session";

interface SessionRecoveryProps {
  redirectTo: string;
}

/**
 * Rendered by the protected layout when a request arrives with no valid
 * access token — most commonly because it expired while the tab sat idle
 * between navigations. This does NOT necessarily mean the user is logged
 * out: the (separately, longer-lived) refresh token may still be valid.
 *
 *   success → router.refresh() re-runs the Server Component tree, which now
 *             finds a fresh access token cookie and renders normally.
 *   failure → the refresh token is also gone/invalid/revoked; this really
 *             is a logged-out session, so redirect to /login.
 */
export function SessionRecovery({ redirectTo }: SessionRecoveryProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "failed">("checking");

  useEffect(() => {
    let cancelled = false;

    refreshSessionAction().then((result) => {
      if (cancelled) return;

      if (result.success) {
        router.refresh();
        return;
      }

      setStatus("failed");
      router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    });

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo]);

  return (
    <div className="sr-screen">
      <div className="sr-content">
        <div className="sr-card" style={{ textAlign: "center" }}>
          <p className="sr-subtitle" style={{ margin: 0 }}>
            {status === "checking" ? "Re-establishing secure link…" : "Session expired. Redirecting to sign in…"}
          </p>
        </div>
      </div>
    </div>
  );
}