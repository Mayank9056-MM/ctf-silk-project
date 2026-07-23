"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07080a",
          color: "#e7e9ec",
          fontFamily: "'Chakra Petch', sans-serif",
          padding: 20,
        }}
      >
        <div
          style={{
            maxWidth: 440,
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "34px 32px",
            background: "#12151b",
          }}
        >
          <p
            style={{
              color: "#c4272a",
              fontSize: 11,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              margin: "0 0 10px",
            }}
          >
            FBI Cyber Division — Critical Failure
          </p>
          <h1 style={{ fontSize: 26, margin: "0 0 14px" }}>System Compromised</h1>
          <p style={{ color: "#7d8592", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 22px" }}>
            The secure channel failed at the root level. This has been logged.
          </p>
          {error.digest && (
            <p style={{ fontFamily: "monospace", fontSize: 11, color: "#4d545e", margin: "0 0 22px" }}>
              Incident Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#c4272a",
              color: "#fff",
              border: "none",
              padding: "12px 22px",
              borderRadius: 6,
              fontSize: 12.5,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Restart System
          </button>
        </div>
      </body>
    </html>
  );
}