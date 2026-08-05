import type {
  HintWithPlayerState,
  HintUnlockResult,
} from "../types/hint.types";
import type { ChallengeHintDTO, HintUnlockDTO } from "../types/hint.dto";

// ============================================================================
// hint.mapper.ts
// ============================================================================
//
// Pure transformation, and nothing else: internal backend shapes
// (HintWithPlayerState, HintUnlockResult — both carrying full Prisma
// Hint/PlayerHint rows) go in, DTOs come out. No database, no logger,
// no audit, no Date.now(), no decision about whether a hint CAN be
// unlocked. Given the same input, every function here always returns
// the same output.
//
// WHY THE REPOSITORY DOESN'T RETURN DTOs ITSELF
// ---------------------------------------------------
// hint.repository.ts has no idea what a UI needs — only how to fetch
// rows efficiently. If it returned ChallengeHintDTO directly, query
// logic and presentation logic would live in the same file with
// nothing separating them, and every new UI requirement would mean
// touching the data-access layer instead of just this one.
//
// WHY THE SERVICE NEVER CONSTRUCTS DTOs BY HAND
// ---------------------------------------------------
// If hint.service.ts built `{ id: hint.id, title: hint.title, ... }`
// itself at every call site, the exact shaping rules below (content
// withheld unless unlocked, canUnlock's collapse logic) would need to
// be repeated correctly every time instead of expressed once, here.
//
// THE canUnlock PROBLEM — READ BEFORE CHANGING EITHER FUNCTION
// ------------------------------------------------------------------
// The DTO needs a `canUnlock` flag, but this file must never decide
// unlock eligibility (order, XP affordability — those are
// hint.service.ts's job, via HINT_UNLOCK_ORDER and a resolved XP
// balance, neither of which this file imports). The split: the SERVICE
// computes `isEligible` — "order-checked and affordable, ignoring
// whether it's already unlocked" — and passes it in. This file only
// ever combines that with a fact it already has (`unlocked`):
//
//     canUnlock = !unlocked && isEligible
//
// Collapsing "already unlocked" into "can't unlock again" isn't a
// business decision — it's the definitional meaning of "unlock"
// applied to a fact already in hand. It is NOT re-deriving order or
// affordability. This mirrors scene.service.ts's own precedent for
// SceneDTO.isCompleted: the service resolves the boolean, the mapper
// only ever places an already-decided value into the right field.
//
// FUNCTIONS DELIBERATELY NOT INCLUDED, AND WHY
// -----------------------------------------------
// - toHintDTO() — there is no HintDTO type to map to. hint.dto.ts
//   itself rejected a bare HintDTO: every real access pattern is
//   challenge-scoped, so a second, near-identical shape had no
//   distinct caller.
// - toHintListDTO() — rejected, following evidence.service.ts's own
//   precedent for the identical shape of problem. EvidenceBoardDTO's
//   `{ items: [...] }` wrapper is built INLINE in the service, not via
//   a dedicated wrapper mapper — only the per-item transformation gets
//   a named function. A one-line object-literal wrap (`{ challengeId,
//   hints }`) has no logic worth naming here either; hint.service.ts
//   constructs HintListDTO directly from an array of already-mapped
//   ChallengeHintDTOs.
// ============================================================================

/**
 * Maps one hint, plus this player's own unlock record for it (or the
 * absence of one), into the shape a client renders.
 *
 * Accepts `HintWithPlayerState` by declared parameter type, but a
 * `HintUnlockResult` value works here too without a second overload —
 * `{ hint: Hint; playerHint: PlayerHint }` is structurally assignable
 * wherever `{ hint: Hint; playerHint: PlayerHint | null }` is expected,
 * since a non-nullable value satisfies a nullable parameter type. This
 * is how toHintUnlockDTO below reuses this same function rather than
 * duplicating its field-by-field logic for the post-unlock case.
 *
 * `isEligible` must already reflect order + affordability, decided by
 * hint.service.ts — see this file's own header for why that split
 * exists. This function only ever combines it with `unlocked`, never
 * recomputes it from scratch.
 */
export function toChallengeHintDTO(
  state: HintWithPlayerState,
  isEligible: boolean,
): ChallengeHintDTO {
  const { hint, playerHint } = state;
  const unlocked = playerHint !== null;

  return {
    id: hint.id,
    title: hint.title,
    level: hint.level,
    xpCost: hint.xpCost,
    unlocked,
    unlockedAt: playerHint?.unlockedAt ?? null,
    canUnlock: !unlocked && isEligible,
    // Withheld unless unlocked — the entire reason this DTO exists
    // separately from a raw Hint row in the first place.
    content: unlocked ? hint.content : null,
  };
}

/**
 * Maps a just-completed unlock into its confirmation response.
 *
 * `isEligible` is passed as `false` when reusing toChallengeHintDTO
 * here — not because eligibility was actually false (the unlock just
 * succeeded), but because it's irrelevant: `unlocked` is always `true`
 * on a HintUnlockResult, so `canUnlock` collapses to `false`
 * regardless of what `isEligible` would have been. Passing a
 * meaningless value explicitly, rather than silently overloading the
 * parameter's meaning, keeps toChallengeHintDTO's contract the same in
 * both call sites.
 *
 * `xpSpent` reads directly from `result.playerHint.xpSpent` — not a
 * separate parameter. hint.types.ts's HintUnlockResult deliberately has
 * no top-level xpSpent field, specifically to avoid two fields that
 * have to independently agree; this function honors that by not
 * reintroducing the duplication one layer up.
 */
export function toHintUnlockDTO(result: HintUnlockResult): HintUnlockDTO {
  return {
    hint: toChallengeHintDTO(result, false),
    xpSpent: result.playerHint.xpSpent,
  };
}
