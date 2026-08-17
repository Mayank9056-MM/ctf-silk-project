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
  // ---- Chapter 0 — Prologue ----
  "cold-open": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953935/cold-open_bqov4c.webp",
  "crime-scene": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953935/crime-scene_kipood.webp",
  funeral: "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953935/funeral_z3xyza.webp",
  // Reassigned from the previous "bullpen-night" key — this is the only
  // Prologue scene actually set at night in the bullpen. Reused rather
  // than left blank since it's already a real, working URL; paste a
  // different one here if this isn't the intended shot.
  "bullpen-three-weeks-later":
    "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953937/bullpen-three-weeks-later_mtomqh.webp",
  "the-pattern": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953936/the-pattern_oetj69.webp",
  "the-supervisor": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953935/the-supervisor_uo04ul.webp",
  "supervisor-pushback": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953936/supervisor-pushback_yuzeyw.webp",
  "supervisor-accept-quietly": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953936/supervisor-accept-quietly_dzwj6d.webp",
  "the-senior-agent": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953936/the-senior-agent_sipleq.webp",
  "brooks-full-evidence": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953937/brooks-full-evidence_ekr2ka.webp",
  "brooks-summary": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953937/brooks-summary_tnatso.webp",
  "the-hidden-phone": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953936/the-hidden-phone_lzbdk7.webp",
  "robert-shadows": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953936/robert-shadows_ioo37d.webp",
  "noahs-grave": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953937/noahs-grave_oszocb.webp",
  "thesis-statement": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953935/thesis-statement_hqfbne.webp",

  // ---- Chapter 1 — The Overdose ----
  "arriving-at-scene": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953937/arriving-at-scene_wpzoif.webp",
  "the-ledger-photo": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953938/the-ledger-photo_fbees1.webp",
  "ask-the-neighbor": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953939/ask-the-neighbor_perqgd.webp",
  "neighbor-pressed": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953938/neighbor-pressed_vtajqd.webp",
  "neighbor-polite": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953938/neighbor-polite_z8xo1r.webp",
  "challenge-gate-toxicology": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953939/challenge-gate-toxicology_pszb2i.webp",
  "the-debrief": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953938/the-debrief_wsdmg3.webp",
  "the-burner-phone": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953938/the-burner-phone_x1vihs.webp",
  "challenge-gate-burner-phone": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953939/challenge-gate-burner-phone_udo2uk.webp",
  "chapter-one-closer": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953939/chapter-one-closer_fltion.webp",

  // ---- Chapter 2 — The Ledger ----
  "the-wallet-thread": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953937/the-wallet-thread_x0c5rk.webp",
  "cross-referencing": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953939/cross-referencing_ljzhvg.webp",
  "follow-the-money": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953938/follow-the-money_ebllei.webp",
  "follow-the-buyers": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953940/follow-the-buyers_z0hii8.webp",
  "challenge-gate-wallet-ledger": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953940/challenge-gate-wallet-ledger_od1hjf.webp",
  "chapter-two-closer": "https://res.cloudinary.com/dp7fychwy/image/upload/v1786953940/chapter-two-closer_icwsnf.webp",
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
  supervisor: "https://res.cloudinary.com/dp7fychwy/image/upload/v1786955204/supervisor_llv87a.webp",
  robert: "https://res.cloudinary.com/dp7fychwy/image/upload/v1786955204/robert_zesjat.webp", // CHARACTERS.md: no confirmed appearance/portrait yet — leave empty until narrative lead confirms
  noah: "https://res.cloudinary.com/dp7fychwy/image/upload/v1786955205/noah-carter_q2ilnk.webp", // CHARACTERS.md: no confirmed appearance — leave empty
};

/** `""` in the map above means "not authored yet" — resolves to null, not a broken `<img src="">`. */
export function resolveCharacterPortrait(slug: string): string | null {
  return CHARACTER_PORTRAITS[slug] || null;
}
