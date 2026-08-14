/** Used sparingly per spec ("scanline only where appropriate") — intended for archival/terminal-styled scenes only, not mounted globally by story-stage.tsx. Caller opts in. */
export function SceneScanlines() {
  return <div className="sr-stage-scanlines" aria-hidden="true" />;
}