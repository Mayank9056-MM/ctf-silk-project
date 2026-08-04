// ============================================================================
// hint.messages.ts
// ============================================================================
//
// Every user-facing or service-facing message string the Hint module
// ever produces lives here, and only here. Without a single home for
// these, hint.service.ts, hint.repository.ts, and any future
// validations/*.schema.ts each end up writing their own version of the
// same message — "Insufficient XP" in one place, "Not enough XP to
// unlock this hint" in another — and the two silently drift apart with
// nothing to catch it, since there's no compiler check on string
// content. Centralizing means a copy change is one edit in one file,
// not a grep across the module hoping every occurrence was found.
//
// WHY THIS FILE HAS NO LOGIC
// -----------------------------
// A message string doesn't decide when it applies — hint.service.ts
// does that, by comparing a player's XP balance against a hint's
// xpCost, or checking PlayerHint for an existing unlock, and only THEN
// reaching for the matching message here. This file supplies the words
// for a decision that was already made elsewhere; it never makes one
// itself. That's why there are no functions here, even simple ones —
// a function that picks between two messages based on a condition
// would be business logic wearing a constants file as a disguise.
//
// WHY SERVICES SHOULD NEVER INLINE MESSAGE STRINGS
// -----------------------------------------------------
// `throw ApiError.notFound(ErrorCode.NOT_FOUND, "Hint not found.")`
// works exactly once. The moment a second call site needs the same
// message, a developer either copies the literal (now two independently
// editable copies) or remembers this file exists (not guaranteed).
// `throw ApiError.notFound(ErrorCode.NOT_FOUND, HINT_MESSAGES.NOT_FOUND)`
// has no such failure mode — there is exactly one string, and every
// caller sees the same edit the moment it's made here.
//
// GROUPING
// -----------
// Two groups, not three. HINT_MESSAGES covers RESOLVING/READING a hint
// — does it exist, is it visible, is it published. UNLOCK_MESSAGES
// covers the unlock transaction's business rules — order, XP,
// one-time-only, the three-hint cap. A separate "VALIDATION_MESSAGES"
// group was considered and rejected: every validation failure in this
// module IS an unlock-rule violation, so a third group would just be
// UNLOCK_MESSAGES under a different name, not a real distinction.
//
// WHAT THIS FILE DELIBERATELY DOES NOT CONTAIN
// -------------------------------------------------
// No business logic, no helper functions, no enums, no numeric
// constants (see hint.constants.ts), no DTOs, no Zod schemas, no Prisma
// queries, no logging, no audit metadata. Every one of those belongs to
// a file that has the context to actually use it; this file only ever
// has a string.
// ============================================================================

/**
 * Messages for RESOLVING a hint — whether it exists, whether it's
 * currently visible to a player, and confirmation of a successful read.
 * Reused by both the player-facing get-hint action and, later, any
 * admin-side lookup that needs the same "does this hint exist" framing.
 */
export const HINT_MESSAGES = {
  NOT_FOUND: "Hint not found.",

  /**
   * A Hint is always resolved in the context of a Challenge (its
   * challengeId FK) — this covers the case where that challenge itself
   * doesn't exist, distinct from the hint not existing.
   */
  CHALLENGE_NOT_FOUND: "Challenge not found.",

  /**
   * Distinct from NOT_FOUND — the row exists, but current state (event
   * not live, challenge not accessible) means it shouldn't be served
   * right now. Kept separate so a service can choose the more accurate
   * message rather than collapsing every "can't show this" case into
   * one generic 404.
   */
  UNAVAILABLE: "This hint is unavailable.",

  /**
   * Specifically a DRAFT/ARCHIVED status found by an authenticated
   * path — reaching this at all means either an authoring gap or a
   * bypassed check, so this message is intentionally specific rather
   * than reusing UNAVAILABLE's more generic wording.
   */
  NOT_PUBLISHED: "This hint is not published.",

  RETRIEVED: "Hint retrieved successfully.",
} as const;

/**
 * Messages for the unlock transaction specifically — every business
 * rule from the module spec has exactly one corresponding message here,
 * and only one: order enforcement, affordability, one-time-only, and
 * the three-hint cap.
 */
export const UNLOCK_MESSAGES = {
  /** A player can unlock a given hint only once — PlayerHint already enforces this at the data level; this is the message for when that rule is what actually stopped the request. */
  ALREADY_UNLOCKED: "You have already unlocked this hint.",

  /** Enforces LEVEL_1 → LEVEL_2 → LEVEL_3 — thrown when a player attempts to unlock a level before completing the one before it. */
  PREVIOUS_HINT_REQUIRED: "You must unlock the previous hint first.",

  /** Hint 2 and Hint 3 may require XP a player doesn't currently have. */
  INSUFFICIENT_XP: "You do not have enough XP to unlock this hint.",

  /** Every challenge has at most three hints — this is what a request for a fourth, nonexistent level actually means to a player, distinct from HINT_MESSAGES.NOT_FOUND's "this specific row doesn't exist." */
  MAX_HINTS_REACHED:
    "The maximum number of hints for this challenge has already been unlocked.",

  UNLOCKED: "Hint unlocked successfully.",
} as const;