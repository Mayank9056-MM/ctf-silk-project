import { DEFAULT_CASE_ID } from "@/lib/constants/case";

interface CaseIdentifierProps {
  caseId?: string;
  /** "badge" — standalone chip (auth card). "inline" — plain text for the HUD bar, which already provides its own chrome. */
  variant?: "badge" | "inline";
  /** Pre-reveal state for contexts that shouldn't show a real case number yet — not used on Login/Register today, provisioned for future story-gated screens. */
  redacted?: boolean;
}

/**
 * The one place "CASE // {id}" is ever rendered. Reused today by
 * HudTop (inline) and AuthShell (badge); the story/dashboard/challenge
 * screens mentioned in the task brief can adopt the same component
 * later without any new markup being invented for them.
 */
export function CaseIdentifier({
  caseId = DEFAULT_CASE_ID,
  variant = "badge",
  redacted = false,
}: CaseIdentifierProps) {
  const label = redacted ? "[REDACTED]" : caseId;

  if (variant === "inline") {
    return <span className="sr-case-inline">CASE // {label}</span>;
  }

  return (
    <span className="sr-case-badge">
      <span className="sr-case-dot" aria-hidden="true" />
      CASE // {label}
    </span>
  );
}
