import type { HintLevel } from "@/app/generated/prisma/enums";

// ============================================================================
// hint.dto.ts
// ============================================================================
//
// The ONLY objects this module's Server Actions may return. hint.types.ts
// carries full-fidelity internal shapes (real Hint/PlayerHint rows,
// booleans a service needs to make a decision) — this file carries only
// what a UI renders. A repository has no business deciding what a
// client needs, so repositories never return these; only hint.mapper.ts
// produces them, from the internal types this module already defined.
//
// WHY PRISMA MODELS MUST NEVER BE RETURNED DIRECTLY
// -------------------------------------------------------
// A raw Hint object tells the client the database schema exists at all
// — status: ContentStatus, createdAt/updatedAt, exact column names.
// None of that is the client's business, and it's an implicit contract:
// the moment a component reads `hint.status === "PUBLISHED"` directly,
// changing that column later becomes a breaking API change wearing a
// schema migration's clothes. These DTOs are the seam that prevents
// that coupling from forming in the first place.
//
// TWO DTOs, NOT FOUR
// ----------------------
// The brief's four candidates were evaluated, not assumed:
//
// - HintDTO — REJECTED. Every real access pattern in this module is
//   challenge-scoped; a hint is never fetched or displayed independent
//   of the challenge that owns it. A separate bare HintDTO would just
//   be ChallengeHintDTO under a different name, with no distinct
//   caller — the unnecessary duplication the brief itself warned
//   against.
// - HintListDTO — KEPT. Matches this project's own established
//   convention for a bounded, non-paginated list response (see
//   EvidenceBoardDTO's identical `{ items: T[] }` shape) — no
//   pagination needed, since "at most three hints per challenge" makes
//   this list always small and complete.
// - HintUnlockDTO — KEPT, but composed rather than duplicated. It wraps
//   a ChallengeHintDTO instead of repeating its fields flat, because the
//   only genuinely NEW fact an unlock response carries that a read
//   never does is how much XP that specific action just spent — every
//   other field is identical to reading that same hint immediately
//   afterward.
//
// A `nextRequiredLevel` field on the list was also considered and
// rejected: it's fully derivable client-side from whichever hint in the
// array has `canUnlock: true`. Adding it as a second, separately
// computed field would be two representations of the same fact with
// nothing forcing them to agree — the same duplication risk this
// module's other files were built to avoid.
// ============================================================================

/**
 * One hint, as a player sees it — whether unlocked or not. `content` is
 * the field this whole DTO exists to gate: it's populated only when
 * `unlocked` is true, and stays `null` otherwise, so an unopened hint's
 * answer-adjacent content is never present in a response the client
 * could inspect before actually unlocking it.
 *
 * `canUnlock` is a STRICTER computation than "not locked by order" —
 * it's true only when the player could successfully attempt this
 * unlock right now: the previous level is cleared, this hint isn't
 * already unlocked, AND the player can currently afford its `xpCost`.
 * A hint can be structurally next-in-line and still have `canUnlock:
 * false` if the player is simply short on XP — the client renders that
 * as a disabled button with a reason, not as a locked icon.
 */
export interface ChallengeHintDTO {
  readonly id: string;
  readonly title: string;

  /**
   * Reused directly from Prisma's own HintLevel enum, not duplicated as
   * a string literal union — the client already needs to know there are
   * exactly three ordered levels to render the unlock sequence UI at
   * all, so this isn't schema leakage the way status/timestamps would
   * be; it's the one piece of the database's vocabulary the UI
   * genuinely needs to share.
   */
  readonly level: HintLevel;

  /**
   * Shown for every hint regardless of unlock state — including ones
   * the player can't afford yet — the same way a shop displays a
   * price before you can afford the item. There's no reason to hide
   * cost information the player will need to plan around.
   */
  readonly xpCost: number;

  readonly unlocked: boolean;

  /** Null until `unlocked` is true. */
  readonly unlockedAt: Date | null;

  readonly canUnlock: boolean;

  /**
   * Whether the level immediately before this one (per HINT_UNLOCK_ORDER)
   * has already been unlocked by this player — vacuously true for
   * LEVEL_1. Added specifically so the client can distinguish LOCKED
   * (order-blocked) from "order is fine, just can't afford it right
   * now" WITHOUT re-deriving hint-access.ts's own order-walking logic
   * in React. `canUnlock` alone collapses both cases to `false`; this
   * field is the one additional fact needed to tell them apart. Always
   * `true` on a HintUnlockDTO's nested hint (a successful unlock is
   * only ever possible once order was already satisfied).
   */
  readonly previousLevelUnlocked: boolean;

  /** Full hint text — present only when `unlocked` is true, `null` otherwise. */
  readonly content: string | null;
}

/**
 * The full set of hints for one challenge, as returned by
 * get-challenge-hints. `challengeId` lives here, at the list level, not
 * repeated on every ChallengeHintDTO — all three hints in one response
 * always share the same challenge, so putting it on each item would be
 * the same fact stated three times for no reason.
 */
export interface HintListDTO {
  readonly challengeId: string;
  readonly hints: readonly ChallengeHintDTO[];
}

/**
 * Returned by the unlock-hint action specifically — never by a read.
 * Wraps the same ChallengeHintDTO a read would return (now guaranteed
 * `unlocked: true`) rather than duplicating its fields flat, and adds
 * the one fact that's genuinely unique to the unlock action itself:
 * how much XP this specific attempt spent, for a confirmation UI
 * ("You spent 10 XP") a plain read has no reason to carry.
 */
export interface HintUnlockDTO {
  readonly hint: ChallengeHintDTO;
  readonly xpSpent: number;
}
