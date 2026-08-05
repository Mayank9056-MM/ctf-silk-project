import type { HintLevel } from "@/app/generated/prisma/enums";
import { HINT_UNLOCK_ORDER } from "../constants/hint.constants";
import type { HintWithPlayerState } from "../types/hint.types";

// ============================================================================
// hint-access.ts
// ============================================================================
//
// Pure business helpers answering exactly one family of questions, given
// an already-loaded HintWithPlayerState[] for one challenge: is this
// hint already unlocked, has the level before it been cleared, and —
// combining both — can this specific hint be unlocked right now. Order
// and unlock-history only. This file has no idea what a player's XP
// balance is, never touches Prisma, never logs, never throws, never
// mutates its inputs.
//
// WHY THIS IS SEPARATE FROM hint.service.ts
// ----------------------------------------------
// hint.service.ts needs the exact same order/history answer from two
// different places: once per hint when building a list response (the
// isEligible value hint.mapper.ts expects), and once for the specific
// hint someone's trying to unlock (the pre-transaction gate, before XP
// is even considered). Centralizing the rule here means both call sites
// use the identical logic — never two independently-maintained copies
// of "has the previous level been unlocked" quietly drifting apart.
//
// WHY NO DATABASE ACCESS BELONGS HERE
// ----------------------------------------
// Every function below operates only on data the caller already loaded.
// Adding a repository call here would mean this file secretly decides
// WHEN to fetch data, not just how to reason about it once fetched —
// exactly the kind of layering violation the project's repository
// pattern exists to prevent, just one layer further up.
//
// WHY XP LOGIC IS DELIBERATELY EXCLUDED
// ------------------------------------------
// Affordability depends on where a player's XP balance actually lives —
// still an open question this module hasn't resolved (see
// hint.types.ts's own flagged gap on HintUnlockContext.currentXp).
// Coupling that unresolved sourcing decision into a pure order-checking
// utility would make this file's correctness depend on something it has
// no way to verify. "Can this hint be unlocked" here means ONLY
// "sequentially eligible and not already unlocked" — affordability is
// a separate check the service applies afterward, using its own
// resolved XP number.
//
// FUNCTIONS DELIBERATELY NOT EXPORTED, AND WHY
// -------------------------------------------------
// - getPreviousLevel() — kept private. No caller needs the actual
//   previous LEVEL value, only whether it's cleared;
//   UNLOCK_MESSAGES.PREVIOUS_HINT_REQUIRED is a static string with no
//   interpolation.
// - findHintByLevel() — kept private, same reasoning: no caller needs
//   the raw sibling row, only the boolean hasUnlockedPreviousLevel
//   derives from it.
// - isFirstHint() — not implemented at all, public or private. It would
//   just be `getPreviousLevel(level) === null`, already handled inline
//   inside hasUnlockedPreviousLevel — a second name for a fact that
//   already has one.
// ============================================================================

/**
 * The level immediately before this one in HINT_UNLOCK_ORDER, or `null`
 * if this level has no prerequisite (LEVEL_1). Private — see the module
 * header for why the actual level value is never exposed on its own.
 */
function getPreviousLevel(level: HintLevel): HintLevel | null {
  const index = HINT_UNLOCK_ORDER.indexOf(level);

  // index 0 is LEVEL_1 — no prerequisite. index -1 would mean `level`
  // isn't a recognized HintLevel at all, which should be unreachable
  // given the column is DB-constrained to the enum; treated the same
  // as "no prerequisite to check" rather than throwing, since this file
  // never throws by design.
  if (index <= 0) return null;

  return HINT_UNLOCK_ORDER[index - 1];
}

/**
 * Locates the sibling hint at a given level within an already-loaded
 * set. Private — see the module header for why the raw row is never
 * exposed; every real caller only needs the boolean derived from it.
 */
function findHintByLevel(
  hints: readonly HintWithPlayerState[],
  level: HintLevel,
): HintWithPlayerState | undefined {
  return hints.find((state) => state.hint.level === level);
}

/**
 * Whether this player has already unlocked this specific hint. Exposed
 * on its own, not only folded into canUnlockHint below, because
 * hint.service.ts needs this checked independently to choose between
 * ALREADY_UNLOCKED and PREVIOUS_HINT_REQUIRED as the correct rejection
 * message — a single combined boolean can't tell the two apart.
 */
export function isHintUnlocked(state: HintWithPlayerState): boolean {
  return state.playerHint !== null;
}

/**
 * Whether the level immediately before `level` has already been
 * unlocked by this player. `LEVEL_1` returns `true` vacuously — nothing
 * precedes it.
 *
 * Fails CLOSED if the previous level's hint isn't even present in the
 * loaded set: a missing prerequisite (an authoring gap — e.g. LEVEL_2
 * seeded without a LEVEL_1) is treated as unmet, never as satisfied.
 * This mirrors unlock.service.ts's own fail-closed discipline for
 * integrity problems in the Story module — the one difference being
 * this file never logs it, since a pure utility has no side effects at
 * all; a service wanting to surface this as an operational signal would
 * need to detect and log it independently.
 */
export function hasUnlockedPreviousLevel(
  hints: readonly HintWithPlayerState[],
  level: HintLevel,
): boolean {
  const previousLevel = getPreviousLevel(level);
  if (previousLevel === null) return true;

  const previousHint = findHintByLevel(hints, previousLevel);
  if (!previousHint) return false;

  return isHintUnlocked(previousHint);
}

/**
 * The single combined question: can this specific hint be unlocked
 * right now, considering ONLY sequential order and unlock history — no
 * XP. This is the exact value hint.mapper.ts's `isEligible` parameter
 * expects when building a list response, where only the collapsed
 * yes/no matters, not which individual rule would have failed.
 */
export function canUnlockHint(
  hints: readonly HintWithPlayerState[],
  targetHint: HintWithPlayerState,
): boolean {
  if (isHintUnlocked(targetHint)) return false;
  return hasUnlockedPreviousLevel(hints, targetHint.hint.level);
}
