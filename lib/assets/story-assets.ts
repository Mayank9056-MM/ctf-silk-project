// ============================================================================
// lib/assets/story-assets.ts
// ============================================================================
//
// Two unrelated things live here, deliberately kept separate:
//
// 1. BACKGROUND_ASSETS + resolveBackgroundAsset() — a REAL allowlist.
//    Scene.metadata is untyped Json?, so metadata.backgroundAssetKey is
//    effectively authoring/CMS input, not a value the server itself
//    chose. scene.mapper.ts MUST resolve through resolveBackgroundAsset()
//    below before anything reaches SceneDTO — never forward the raw key
//    or a raw metadata string to the client.
//
// 2. CHARACTER_PORTRAITS — NOT a runtime resolver. Character.portraitUrl
//    is a typed schema column populated only by seed scripts; there is no
//    client-controlled input path into it the way there is for
//    Scene.metadata. This map exists purely so seed-story.ts (and any
//    future admin tooling) has one place to look up a character's
//    Cloudinary URL instead of duplicating literals across seed files.
//
// All URLs below are unfilled — paste real Cloudinary URLs before running
// any seed script that reads from this file. An empty string is treated
// as "no asset" (coalesced to null at the call site), not a broken link.
// ============================================================================

const BACKGROUND_ASSETS: Record<string, string> = {
  "bullpen-night":
    "https://res.cloudinary.com/dp7fychwy/image/upload/v1786776213/bullpen-night_l757vy.webp",
  "bullpen-day": "",
  "crime-scene-apartment": "",
  "cemetery-day": "",
  "cemetery-night": "",
  "supervisors-office": "",
  "brooks-office-day": "",
  "brooks-office-night": "",
  "roberts-command-center": "",
};

/**
 * The one and only place a Scene.metadata background reference is turned
 * into a URL. Unknown keys fail closed (return null → gradient fallback
 * in SceneBackground) rather than throwing — a bad key in authored
 * content shouldn't crash the player's session, but it must be logged so
 * the gap gets caught before it ships.
 */
export function resolveBackgroundAsset(assetKey: unknown): string | null {
  if (typeof assetKey !== "string") return null;

  const url = BACKGROUND_ASSETS[assetKey];
  if (!url) {
    console.warn(
      `[story-assets] Unknown or unfilled backgroundAssetKey "${assetKey}" — failing closed (no background rendered).`,
    );
    return null;
  }
  return url;
}

/** Seed-time validation helper — lets a seed script assert a key it's about to write actually resolves, before it ever reaches a player. */
export function isKnownBackgroundAssetKey(assetKey: string): boolean {
  return assetKey in BACKGROUND_ASSETS;
}

// ----------------------------------------------------------------------------
// Character portraits — seed-time convenience only, see file header.
// ----------------------------------------------------------------------------

export const CHARACTER_PORTRAITS: Record<string, string> = {
  "ethan-carter": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786777358/ethan-carter-portrait-noir_en2mlr.webp",
  "daniel-brooks": "",
  supervisor: "",
  robert: "", // CHARACTERS.md: no confirmed appearance/portrait yet — leave empty until narrative lead confirms
  noah: "", // CHARACTERS.md: no confirmed appearance — leave empty
};

/** `""` in the map above means "not authored yet" — resolves to null, not a broken `<img src="">`. */
export function resolveCharacterPortrait(slug: string): string | null {
  return CHARACTER_PORTRAITS[slug] || null;
}
