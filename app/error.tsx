"use client";

import { useEffect } from "react";
import Link from "next/link";

import { SystemShell } from "@/components/system/system-shell";

interface ErrorScreenProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary for this route segment — Next.js requires this to be a
 * Client Component. Only `error.digest` (a safe reference code) is ever
 * shown; `error.message`/stack are logged, never rendered, since a raw
 * error message can leak internals the player has no business seeing.
 */
export default function ErrorScreen({ error, reset }: ErrorScreenProps) {
  useEffect(() => {
    console.error("[route error boundary]", error);
  }, [error]);

  return (
    <SystemShell caseId="SR-0417">
      <div className="sr-card sr-system-card">
        <span className="sr-eyebrow sr-eyebrow-accent">
          FBI Cyber Division — Secure Link
        </span>

        <div className="sr-status-ring" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
            <path d="M10 2v7M10 13v1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
          </svg>
        </div>

        <h1 className="sr-title" style={{ fontSize: "clamp(24px, 4vw, 32px)" }}>
          Secure Link <span>Severed</span>
        </h1>
        <p className="sr-subtitle" style={{ marginBottom: 6 }}>
          Something broke the connection to the case archive mid-transfer.
        </p>
        <p className="sr-subtitle">
          Your progress is safe — this is a connection issue, not a lost case.
        </p>

        {error.digest && (
          <div
            className="sr-file-block"
            style={{ fontSize: 11.5, color: "var(--sr-dimmer)" }}
          >
            Incident Reference: {error.digest}
          </div>
        )}

        <div className="sr-button-row">
          <button type="button" className="sr-button" onClick={reset}>
            Reconnect
          </button>
          <Link href="/dashboard" className="sr-button sr-button-secondary">
            Return to Safehouse
          </Link>
        </div>
      </div>
    </SystemShell>
  );
}