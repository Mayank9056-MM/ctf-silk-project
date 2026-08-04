// ============================================================================
// hint.enums.ts
// ============================================================================


/**
 * A hint's unlock state relative to ONE specific player — never a
 * property of the Hint row itself, and never stored. The same hint is
 * LOCKED for a player who hasn't cleared the level before it,
 * AVAILABLE for a player who could unlock it right now, and UNLOCKED
 * for a player who already has. There is no "is this locked" column on
 * Hint, because the question only means something in the context of
 * one specific player's PlayerHint history — this is computed fresh on
 * every request from PlayerHint + HINT_UNLOCK_ORDER, the identical
 * "derive, don't store" discipline ChapterProgressState already
 * established for the Story module's campaign map.
 *
 * Drives the hint-list UI: which hints render as a locked icon, which
 * render as "unlock for N XP," and which render their full content
 * directly — all decided before any unlock attempt is ever made, which
 * is exactly why this can't just be inferred from an unlock error: a
 * player needs to see this state WITHOUT triggering the failure path
 * UNLOCK_MESSAGES/ApiError would produce if they tried anyway.
 */
export enum HintAccessState {
  /**
   * The level before this one in HINT_UNLOCK_ORDER hasn't been
   * unlocked yet. This hint cannot be requested at all, regardless of
   * the player's XP balance — order is checked before affordability.
   */
  LOCKED = "LOCKED",

  /**
   * The previous level (if any) is unlocked, this hint isn't unlocked
   * yet, and nothing else is blocking it. Content is still hidden, but
   * an unlock attempt at this point would be evaluated against XP, not
   * order — the only remaining gate.
   */
  AVAILABLE = "AVAILABLE",

  /**
   * The player has already unlocked this hint. Its full content can be
   * returned directly, with no business-rule check needed — PlayerHint
   * already proves it.
   */
  UNLOCKED = "UNLOCKED",
}