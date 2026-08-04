import { ContentStatus, HintLevel } from "@/app/generated/prisma/enums";

// ============================================================================
// hint.constants.ts
// ============================================================================
//
// The Hint module is NOT a CMS. Every Hint row is authored exactly once,
// before the event, via scripts/seed-hints.ts — there is no runtime
// create/update/delete path, and there never will be one while an event
// is live (the project's own standing rule: nothing gets built ahead of
// a real, scheduled need, and a live-authoring CMS for hints isn't one).
//
// At runtime the module does exactly three things: a player VIEWS a
// hint, a player UNLOCKS a hint (writing a PlayerHint row, possibly
// deducting XP), and that unlock history is read back. None of those
// three things are decided here.
//
// WHAT BELONGS IN THIS FILE
// --------------------------
// Only immutable module configuration — values a human can sanity-check
// by reading them, with no database, no request, and no player state
// involved. The unlock sequence, the hard cap on hints per challenge,
// defensive bounds on xpCost, and the SEED-TIME defaults seed-hints.ts
// falls back to when authoring content.
//
// WHAT MUST NEVER BELONG IN THIS FILE
// -------------------------------------
// - Whether a specific player can unlock a specific hint right now —
//   that requires reading PlayerHint history and the player's XP
//   balance, both of which only hint.service.ts has access to. A
//   constants file with no database connection cannot enforce a
//   business rule; it can only describe one for something else to
//   enforce.
// - Zod schemas, DTOs, or Prisma queries — all of the above require
//   imports and logic this file is deliberately inert without.
// - User-facing strings ("You don't have enough XP for this hint") —
//   those belong wherever this module's error messages actually live,
//   not bundled into what should stay pure configuration.
//
// Database enforces relational integrity (FKs, PlayerHint's own
// composite-key "one unlock record per player per hint" invariant).
// hint.service.ts enforces business logic (order, affordability). This
// file enforces neither — it only gives both a single, shared source of
// truth to enforce them BY.
// ============================================================================

// ----------------------------------------------------------------------------
// Unlock order
// ----------------------------------------------------------------------------

/**
 * The fixed sequence a player must unlock hints in for a given
 * challenge — LEVEL_1 before LEVEL_2 before LEVEL_3, never out of
 * order. hint.service.ts reads this to determine "what's the next
 * level this player hasn't unlocked yet" by walking the array, rather
 * than re-deriving order from HintLevel's own declaration position —
 * the same reasoning AUDIT_SEVERITY_ORDER was centralized for: ordering
 * is a semantic decision, not something safe to infer implicitly from
 * enum member order every time it's needed.
 */
export const HINT_UNLOCK_ORDER: readonly HintLevel[] = [
  HintLevel.LEVEL_1,
  HintLevel.LEVEL_2,
  HintLevel.LEVEL_3,
] as const;

// ----------------------------------------------------------------------------
// Limits
// ----------------------------------------------------------------------------

export const HINT_LIMITS = {
  /**
   * Every challenge has AT MOST three hints — this is HINT_UNLOCK_ORDER's
   * own length, not a second, independently-maintained number that
   * could quietly drift from it if a level were ever added or removed.
   * Enforced by seed-hints.ts refusing to author a fourth hint for any
   * one challenge; there is no DB-level check constraint for this,
   * since Hint has no natural composite key that would express "at most
   * three rows per challengeId" on its own.
   */
  MAX_HINTS_PER_CHALLENGE: HINT_UNLOCK_ORDER.length,

  /**
   * xpCost sanity bounds — not a business rule about what a hint SHOULD
   * cost (that's a content-balancing decision each Hint row makes for
   * itself), but a defensive ceiling/floor against an authoring typo.
   * xpCost subtracts directly from a player's score-relevant currency;
   * an unreasonable value here would silently distort game balance
   * rather than fail loudly, which is exactly the kind of guarantee
   * this project pushes into a shared, structural check rather than
   * trusting every future edit to docs/story content to get right.
   */
  MIN_XP_COST: 0,
  MAX_XP_COST: 100,

  /**
   * Defensive pagination ceiling for an admin-side "hint usage" listing
   * (who unlocked which hints, when) — mirrors AUDIT_LIMITS.MAX_QUERY_ROWS.
   * Not exercised by any action yet (no admin hint-usage view exists),
   * included now because the shape of that eventual query is already
   * obvious from PlayerHint's own fields, same as audit's own limits
   * were defined before every read action that uses them existed.
   */
  MAX_QUERY_ROWS: 200,
} as const;

// ----------------------------------------------------------------------------
// Defaults
// ----------------------------------------------------------------------------

export const HINT_DEFAULTS = {
  /**
   * "Hint 1 is free by default" — a SEED-TIME default, not a runtime
   * rule. Individual Hint rows own their actual xpCost (per the
   * project's own model spec), so this only describes what
   * seed-hints.ts assumes when a challenge's authored content doesn't
   * explicitly override it. Changing this constant retroactively
   * changes nothing about hints already seeded into the database.
   */
  FREE_HINT_LEVEL: HintLevel.LEVEL_1,

  /** Status a freshly-authored Hint gets if seed-hints.ts doesn't set one explicitly — matches Chapter/Scene/Evidence's own ContentStatus default of "not yet player-visible until deliberately published." */
  DEFAULT_STATUS: ContentStatus.DRAFT,

  /** Pagination default for the same admin hint-usage listing HINT_LIMITS.MAX_QUERY_ROWS bounds — mirrors AUDIT_DEFAULTS.PAGE_SIZE. */
  PAGE_SIZE: 50,
} as const;

/**
 * Per-level seed-time XP cost defaults — what seed-hints.ts falls back
 * to for a hint whose authored content doesn't specify its own xpCost.
 * These are tunable content-balancing placeholders, not business rules:
 * adjust freely per actual challenge difficulty before the event. LEVEL_1
 * defaults to 0, matching HINT_DEFAULTS.FREE_HINT_LEVEL; LEVEL_2/LEVEL_3
 * default to a modest, non-zero cost since "may cost XP" is the only
 * constraint the project spec places on them.
 */
export const HINT_DEFAULT_XP_COST: Readonly<Record<HintLevel, number>> = {
  [HintLevel.LEVEL_1]: 0,
  [HintLevel.LEVEL_2]: 10,
  [HintLevel.LEVEL_3]: 25,
} as const;