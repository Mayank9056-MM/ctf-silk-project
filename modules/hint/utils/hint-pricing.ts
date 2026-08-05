import { HINT_LIMITS } from "../constants/hint.constants";

// ============================================================================
// hint-pricing.ts
// ============================================================================
//
// Pure arithmetic only: can a player afford a hint, and what's the
// actual cost once a defensive bound is applied to it. Nothing here
// writes anything, loads anything, or knows where a player's XP balance
// actually lives — it only ever compares numbers it's handed.
//
// WHY AFFORDABILITY IS DIFFERENT FROM DEDUCTION
// ----------------------------------------------------
// "Can this player afford this hint" is a read-only comparison, safe to
// compute as many times as needed with zero consequence. "Deduct this
// player's XP" is a write with real consequences under concurrency — it
// has to happen exactly once, inside a transaction, with the database
// itself enforcing atomicity. This file never computes a new balance to
// be written back; doing so would tempt a caller into a read-then-write
// pattern that's exactly the race condition an atomic DB-level decrement
// exists to prevent. hint.service.ts owns the actual deduction; this
// file only ever answers "is this affordable" and "what's the real cost."
//
// WHY DATABASE WRITES NEVER BELONG HERE
// ------------------------------------------
// Every function below is a comparison or a clamp on numbers already in
// hand. The moment one of them reached into a repository "to be sure,"
// it would stop being a pricing helper and become a service method
// wearing a utility's name.
//
// FUNCTIONS DELIBERATELY REJECTED, AND WHY
// ---------------------------------------------
// - resolveHintCost() as a trivial pass-through — rejected. hint.xpCost
//   is already a plain field access; a function that does nothing but
//   return it would be exactly the kind of helper this file exists to
//   avoid. Its only legitimate value — normalization — is what
//   normalizeXpCost below actually does.
// - calculateRemainingXp() — rejected. HintUnlockDTO (hint.dto.ts) is
//   `{ hint, xpSpent }` — there is no "remaining balance" field
//   anywhere in this module's DTOs for this value to feed. Even if one
//   existed, it should come from re-reading the authoritative
//   post-transaction balance, not a pre-transaction subtraction
//   computed here — two concurrent unlock attempts starting from the
//   same currentXp would each compute a "remaining" figure that's wrong
//   the moment the database actually serializes both writes.
// - calculateXpSpent() — rejected. No discounts or dynamic pricing
//   exist in this business (already settled when HintPricingContext was
//   rejected in hint.types.ts) — the amount spent at unlock time is
//   just normalizeXpCost(hint.xpCost). A second name for a value this
//   file already produces, not a new calculation.
// ============================================================================

/**
 * Clamps a raw xpCost into [HINT_LIMITS.MIN_XP_COST, HINT_LIMITS.MAX_XP_COST].
 * Defends against a corrupted or out-of-range seeded value reaching an
 * affordability check or being persisted into PlayerHint.xpSpent as-is
 * — the same "authoring typo" scenario those bounds were defined for in
 * hint.constants.ts, given their first real caller here.
 *
 * Takes a bare number, not a full Hint entity — keeps this function
 * testable with a plain integer and keeps this file's imports to
 * exactly what it needs, nothing Prisma-shaped.
 */
export function normalizeXpCost(rawXpCost: number): number {
  return Math.min(
    Math.max(rawXpCost, HINT_LIMITS.MIN_XP_COST),
    HINT_LIMITS.MAX_XP_COST,
  );
}

/**
 * Whether `currentXp` is enough to cover `hintCost`. Normalizes
 * `hintCost` internally rather than trusting the caller to have already
 * done so — the same "push the guarantee into the one shared function"
 * discipline this project applies everywhere else, so a caller can't
 * accidentally compare against a raw, unclamped value by forgetting a
 * second call.
 */
export function hasEnoughXp(currentXp: number, hintCost: number): boolean {
  return currentXp >= normalizeXpCost(hintCost);
}
