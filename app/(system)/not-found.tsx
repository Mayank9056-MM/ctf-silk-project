import Link from "next/link";
import type { Metadata } from "next";

import { SystemShell } from "@/components/system/system-shell";

export const metadata: Metadata = { title: "Record Not Found — Operation Silk Road" };

/** Rendered for unmatched routes, or explicitly via notFound(). */
export default function NotFound() {
  return (
    <SystemShell caseId="SR-0417">
      <div className="sr-card sr-system-card">
        <span className="sr-eyebrow sr-eyebrow-accent">
          FBI Cyber Division — Records Access
        </span>
        <h1 className="sr-status-code" data-glitch="404">
          404
        </h1>
        <p className="sr-subtitle" style={{ marginBottom: 4 }}>
          This case file doesn&apos;t exist in the archive.
        </p>
        <p className="sr-subtitle" style={{ marginBottom: 0 }}>
          It may have been sealed, redacted, or never filed at all.
        </p>

        <div className="sr-file-block" aria-hidden="true">
          <div className="sr-redacted-line" style={{ width: "70%" }} />
          <div className="sr-redacted-line" style={{ width: "94%" }} />
          <div className="sr-redacted-line" style={{ width: "55%" }} />
        </div>

        <div className="sr-button-row">
          <Link href="/dashboard" className="sr-button">
            Return to Case Board
          </Link>
          <Link href="/" className="sr-button sr-button-secondary">
            Back to Safehouse
          </Link>
        </div>
      </div>
    </SystemShell>
  );
}