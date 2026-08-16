// ============================================================================
// lib/assets/challenge-assets.ts
// ============================================================================
//
// CTF challenge attachment files — a SEPARATE system from Cloudinary-hosted
// story assets (story-assets.ts) and public webp story assets
// (character-assets.ts). Challenge attachments are authored files (PDFs,
// spreadsheets, PCAPs, images, etc.) that live under the project ROOT's
// `assets/challenges/` directory — NOT under `public/`, and therefore not
// statically served by Next.js (Next only auto-serves `public/`). The
// only way a player ever receives these bytes is through the
// authenticated route at
// app/api/challenges/[challengeId]/attachments/[attachmentId]/route.ts,
// which re-derives ChallengeAccessService authorization on every request
// and resolves the attachment through resolveChallengeAsset() below.
//
// ChallengeAttachment.filePath is NOT treated as a literal filesystem
// path anywhere in this codebase. It is an asset KEY into this allowlist
// — exactly the relationship Scene.metadata.backgroundAssetKey has to
// BACKGROUND_ASSETS in story-assets.ts. The column name "filePath" is a
// pre-existing schema name kept as-is (no migration) — see the note in
// the attachment route and the schema-comment suggestion in the final
// report. Treating its stored value as a literal path
// (e.g. `fs.readFile(attachment.filePath)`) would let anything ever
// written into that column — a bug, a bad migration, a compromised admin
// session — resolve to an arbitrary file on disk. Routing every lookup
// through this fixed map means the complete set of files a player can
// ever receive is exactly the set of entries below, decided at deploy
// time, never at request time, and never influenced by what's actually
// stored in the database.
//
// All values are paths RELATIVE to the project root's `assets/` directory
// (so "challenges/c42/evidence-ledger.xlsx" resolves to
// `<repo root>/assets/challenges/c42/evidence-ledger.xlsx`). Fill in real
// relative paths before any challenge referencing them goes live — an
// empty registry means every lookup fails closed, matching
// story-assets.ts's "unfilled = null, not a crash" convention.
//
// NOTE: this file currently ships with NO entries. I have not seen
// scripts/seed-challenges.ts (or wherever ChallengeAttachment rows are
// actually created), so I don't know the real key format or real file
// paths in use today, and I'm not going to fabricate plausible-looking
// entries that might point at files that don't exist on disk. Populate
// this from the real seed data.
// ============================================================================
const CHALLENGE_ASSETS: Record<string, string> = {
  "the-pattern-tutorial-case-files": "challenges/the-pattern-tutorial/case-files-overview.png",
};
/**
 * The one and only place a ChallengeAttachment's stored key is turned
 * into an actual relative filesystem path. Unknown keys fail closed
 * (return null) rather than throwing — the caller (the attachment route)
 * turns a null resolution into the same generic 404 used for every other
 * denial, so an unfilled/bad key in authored content never
 * distinguishably differs from "attachment doesn't exist" or "not
 * authorized."
 *
 * Defense in depth even though every value here is server-authored, not
 * request-supplied: reject any resolved value containing `..`, a leading
 * `/`, a Windows drive letter, or a URL scheme — so a future registry
 * entry accidentally pasted as an absolute/traversal path fails loudly
 * here rather than silently working.
 */
export function resolveChallengeAsset(assetKey: unknown): string | null {
  if (typeof assetKey !== "string") return null;

  const relativePath = CHALLENGE_ASSETS[assetKey];
  if (!relativePath) {
    console.warn(
      `[challenge-assets] Unknown or unfilled asset key "${assetKey}" — failing closed.`,
    );
    return null;
  }

  if (!isSafeRelativePath(relativePath)) {
    console.error(
      `[challenge-assets] Asset key "${assetKey}" resolves to an unsafe path ("${relativePath}") — failing closed. Fix this CHALLENGE_ASSETS entry.`,
    );
    return null;
  }

  return relativePath;
}

/** Seed-time validation helper — mirrors isKnownBackgroundAssetKey in story-assets.ts. */
export function isKnownChallengeAssetKey(assetKey: string): boolean {
  return assetKey in CHALLENGE_ASSETS;
}

function isSafeRelativePath(relativePath: string): boolean {
  if (relativePath.length === 0) return false;
  if (relativePath.startsWith("/")) return false;
  if (relativePath.includes("..")) return false;
  if (/^[a-zA-Z]:[\\/]/.test(relativePath)) return false; // Windows drive letter
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(relativePath)) return false; // any://scheme, incl. file://
  return true;
}