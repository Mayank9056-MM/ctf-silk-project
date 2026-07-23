import { SystemShell } from "@/components/system/system-shell";

/**
 * Automatic Suspense fallback for this route segment. Deliberately the
 * cheapest screen in the theme — no particle canvas — since this can flash
 * briefly on every navigation and needs to render instantly, not
 * cinematically.
 */
export default function Loading() {
  return (
    <SystemShell caseId="SR-0417" showParticles={false}>
      <div className="sr-card sr-system-card">
        <span className="sr-loading-dot" aria-hidden="true" />
        <span className="sr-eyebrow" style={{ verticalAlign: "middle" }}>
          Establishing Secure Link
        </span>

        <div className="sr-loading-lines" style={{ marginTop: 18 }} aria-hidden="true">
          <span>&gt; authenticating channel...</span>
          <span>&gt; decrypting case archive...</span>
          <span>&gt; loading evidence index...</span>
        </div>

        <p className="sr-subtitle" style={{ marginTop: 18, marginBottom: 0 }} role="status">
          One moment, Agent.
        </p>
      </div>
    </SystemShell>
  );
}