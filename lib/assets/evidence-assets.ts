// ============================================================================
// lib/assets/evidence-assets.ts
// ============================================================================
//
// Seed-time convenience map only — see story-assets.ts's file header for
// why this is NOT a runtime allowlist resolver the way backgrounds are.
// Evidence.attachmentUrl is a typed schema column; there is no
// client-controlled Json blob in this path to guard against.
//
// Deliberately does NOT include anything challenge-related — challenge
// attachments stay in server /public per your instruction, untouched by
// this file, so they can't drift if a Cloudinary asset gets swapped.
// ============================================================================

export const EVIDENCE_ATTACHMENTS: Record<string, string> = {
  "toxicology-report": "", // TODO: Cloudinary URL
  "wallet-ledger-photo": "",
  "burner-phone-tower-logs": "",
  "secure-encrypted-phone": "",
  "noahs-keychain": "", // intentionally may stay "" — PROLOGUE.md Scene 3 treats this as a personal item, not a photographed exhibit
};

/** `""` means "not authored yet" — resolves to null. */
export function resolveEvidenceAttachment(slug: string): string | null {
  return EVIDENCE_ATTACHMENTS[slug] || null;
}