/**
 * Single source of truth for the default in-fiction case ID. Every
 * component that renders "CASE // SR-0417" (HudTop, CaseIdentifier,
 * SystemShell's callers) imports this rather than repeating the
 * literal — a future story chapter changing the active case number is
 * then a one-line change, not a find-and-replace across the codebase.
 */
export const DEFAULT_CASE_ID = "SR-0417";
