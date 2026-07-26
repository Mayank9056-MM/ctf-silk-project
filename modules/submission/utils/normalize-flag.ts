/**
 * Zero-width and invisible Unicode characters that sometimes ride along
 * with copy-pasted text (from Discord, a terminal, a PDF, a "smart"
 * editor) without being visible to the player. Left in, they'd make a
 * visually-correct flag fail an exact-match check for a reason the
 * player has no way to see or reproduce — a bad failure mode for a live,
 * time-pressured event where every submission counts.
 */
const INVISIBLE_CHARACTERS_PATTERN = /[\u200B-\u200D\uFEFF\u2060\u00AD]/g;

/**
 * Unicode whitespace at the edges, not just ASCII space — a plain
 * .trim() misses things like a non-breaking space (U+00A0) that a
 * copy-paste can introduce.
 */
const EDGE_WHITESPACE_PATTERN = /^[\s\u00A0]+|[\s\u00A0]+$/g;

/**
 * Canonical pre-validation cleanup for a submitted flag.
 *
 * Deliberately does NOT case-fold. This game's flags are case-sensitive
 * by contract (see submit-flag.schema.ts's regex) — a mismatched-case
 * submission should fail validation as a genuine "you didn't copy this
 * exactly" signal, not get silently coerced into matching.
 *
 * Deliberately does NOT worry about homoglyphs (e.g. a Cyrillic character
 * that looks like a Latin one) — the schema's regex only accepts
 * `[a-z0-9_]`, so any character substitution outside that range already
 * fails validation downstream. No separate detection needed here.
 *
 * Idempotent by design: normalizeFlag(normalizeFlag(x)) === normalizeFlag(x).
 * Safe to call more than once across a request (schema transform, then
 * again anywhere downstream) without side effects.
 */
export function normalizeFlag(flag: string): string {
  return flag
    .normalize("NFC")
    .replace(INVISIBLE_CHARACTERS_PATTERN, "")
    .replace(EDGE_WHITESPACE_PATTERN, "");
}