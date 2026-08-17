// ============================================================================
// lib/assets/evidence-assets.ts
// ============================================================================
export const EVIDENCE_ATTACHMENTS: Record<string, string> = {
  "toxicology-report": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786948692/toxicology-report_z8fzmk.png", // paste Cloudinary URL here
  "wallet-ledger-photo": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786949482/wallet-ledger-photo_gdg6a0.webp",
  "burner-phone-tower-logs": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786949628/burner-phone-tower-logs_cds8hs.png",
  "secure-encrypted-phone": "",
  "noahs-keychain": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786949837/ChatGPT_Image_Aug_17_2026_12_26_35_PM_k85b8b.png", // leave "" if you decide this stays image-less, per PROLOGUE.md
};

/** `""` means "not authored yet" — resolves to null. */
export function resolveEvidenceAttachment(slug: string): string | null {
  return EVIDENCE_ATTACHMENTS[slug] || null;
}