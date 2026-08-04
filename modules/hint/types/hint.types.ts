import type { Hint, PlayerHint } from "@/app/generated/prisma/client";

// ============================================================================
// hint.types.ts
// ============================================================================
//
// Internal backend contracts only — shared between hint.repository.ts,
// hint.service.ts, and hint.mapper.ts, and NEVER returned directly from
// an action. hint.service.ts needs to reason about a Hint row together
// with facts that aren't on the Hint model itself: whether THIS player
// has already unlocked it, whether the level before it is cleared, what
// their XP balance is. Prisma's generated Hint/PlayerHint types are
// correct on their own, but neither is the shape the service actually
// operates on — this file is where those compositions get names.
//
// WHY THESE ARE INTERNAL, NOT DTOs
// ------------------------------------
// Nothing here is sensitive the way flagHash was — a Hint's content
// isn't a secret answer. These are internal because they're BACKEND
// REASONING shapes, not response shapes. HintUnlockContext exists so
// the service can DECIDE something; a client has no use for
// `previousLevelUnlocked: boolean` as raw data — it needs the
// CONSEQUENCE of that decision, reshaped into a DTO by hint.mapper.ts.
// Keeping types.ts and dto.ts as separate files is what stops a DTO
// from ever accidentally inheriting an internal-only field added here
// later — the same discipline that made the original flagHash leak
// elsewhere in this codebase possible in the first place, deliberately
// not repeated here.
//
// WHAT WAS CONSIDERED AND REJECTED
// -------------------------------------
// - HintWithChallenge — rejected. Resolving whether a Challenge exists
//   is challenge.service.ts's job; the Hint module only ever needs an
//   already-validated challengeId, not a joined Challenge object. Type
//   coupling across module boundaries with no actual consumer is the
//   unnecessary abstraction the brief warned against.
// - HintUnlockInput — rejected. The validated shape a client sends to
//   trigger an unlock belongs to a Zod schema in validations/, inferred
//   via z.infer, the same way LoginInput/RegisterInput already work in
//   the Auth module — not hand-declared a second time here.
// - HintPricingContext — rejected. xpCost is already a stored, static
//   field on Hint (per this module's own business rules: "Individual
//   Hint records own their actual xpCost"). There is no discount logic,
//   no dynamic pricing, nothing to compute — a "pricing context" type
//   would model complexity this business doesn't have.
// - HintLookupResult — rejected. Every repository in this project
//   returns `T | null` directly (findByEmail, findById, etc.) — never
//   wrapped in a "LookupResult" container. Introducing one here for
//   Hint alone would be an inconsistent, one-off convention.
// ============================================================================

/**
 * A Hint row paired with the requesting player's own unlock record for
 * it, if one exists. This is the repository/service boundary this
 * module's own data flow describes: the repository returns this shape
 * (a single query joining Hint with this player's PlayerHint row),
 * hint.service.ts consumes it, hint.mapper.ts converts it into a
 * ChallengeHintDTO.
 *
 * `playerHint` stays nullable deliberately — that nullability IS the
 * signal a mapper needs to choose between withholding a hint's content
 * (locked/available, not yet unlocked) and including it (unlocked).
 */
export interface HintWithPlayerState {
  hint: Hint;
  playerHint: PlayerHint | null;
}

/**
 * Everything hint.service.ts's unlock logic needs to decide whether an
 * attempt is allowed, assembled BEFORE the transaction opens — order
 * and affordability are both checked against this single object, not
 * against live queries scattered through the unlock method itself.
 *
 * `currentXp` is deliberately just a number, not a reference to
 * wherever that balance actually lives (LeaderboardEntry.totalXp, a
 * dedicated wallet column, or something else not yet decided). Sourcing
 * that number is a service-layer decision this type doesn't make on
 * its behalf — it only describes what the unlock logic needs once the
 * number is known.
 */
export interface HintUnlockContext {
  hint: Hint;

  /**
   * Whether the level immediately before this hint's level (per
   * HINT_UNLOCK_ORDER) has already been unlocked by this player.
   * Vacuously true for a LEVEL_1 hint, since nothing precedes it.
   */
  previousLevelUnlocked: boolean;

  /**
   * Whether this exact hint is already in the player's PlayerHint
   * history. True here rejects the attempt with ALREADY_UNLOCKED
   * before order or affordability are even considered — a player can
   * unlock a hint only once, and that check comes first.
   */
  alreadyUnlocked: boolean;

  currentXp: number;
}

/**
 * The assembled internal shape of a SUCCESSFUL unlock — never a
 * failure outcome, and not the "result" enum a reader of
 * hint.enums.ts's rejected HintUnlockResult might expect. Every unlock
 * failure in this module is an ApiError + UNLOCK_MESSAGES pair, thrown,
 * never returned as data — this type exists for the one outcome that
 * genuinely IS returned as data: a successful unlock, on its way to
 * hint.mapper.ts.
 *
 * `playerHint` is non-nullable here — unlike HintWithPlayerState, where
 * it can be null (the hint may not be unlocked yet), a HintUnlockResult
 * only ever exists after the PlayerHint row has actually been created
 * inside the unlock transaction.
 */
export interface HintUnlockResult {
  hint: Hint;
  playerHint: PlayerHint;
}