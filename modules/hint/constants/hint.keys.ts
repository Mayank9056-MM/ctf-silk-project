/**
 * TanStack Query key registry for the Hint module. Flat tuples with
 * `as const`, matching challengeKeys/leaderboardKeys/storyKeys/auditKeys
 * — no nested factory-library abstraction, since no key file in this
 * project uses one.
 *
 * WHY CENTRALIZED
 * -------------------
 * useChallengeHints stores data under a key; unlockHint's success
 * handler invalidates that same key from a completely different file.
 * Nothing forces two independently hand-written literals to agree —
 * one function both import removes that risk entirely.
 *
 * CACHE STRATEGY
 * -------------------
 * Only two keys exist, deliberately: `all` and `challenge(challengeId)`.
 * `all` is not a speculative "just in case" root key — it's the real
 * invalidation target unlockHint's success handler needs. A hint's
 * `canUnlock` flag depends on the player's GLOBAL XP balance
 * (hasEnoughXp, evaluated in hint.service.ts), not just facts scoped to
 * whichever challenge is currently open — so unlocking a hint in one
 * challenge can make a hint in a completely different challenge newly
 * unaffordable. Invalidating only the acted-on challenge's key would
 * leave every other challenge's hint list silently stale. `all`
 * resolves this via TanStack's prefix matching: invalidating `["hint"]`
 * cascades to every `["hint", "challenge", ...]` entry beneath it.
 *
 * `lists()`, `detail(hintId)`, and `player()` were all considered and
 * rejected. `lists()` would be a second name for exactly what `all`
 * already means — there's only one query SHAPE in this module, unlike
 * audit.keys.ts where it separated several genuinely different ones.
 * `detail(hintId)` has no backing caller: hint.dto.ts already rejected a
 * standalone single-hint fetch, for the same reason every real access
 * pattern here is challenge-scoped. `player()` would imply "every hint
 * this player has ever unlocked, across all challenges" — no DTO,
 * service method, or hook for that exists.
 */
export const hintKeys = {
  /**
   * Root key. The real target for unlockHint's post-mutation
   * invalidation — see the module-level cache strategy note above for
   * why a narrower, single-challenge invalidation would be incorrect,
   * not just less thorough.
   */
  all: ["hint"] as const,

  /**
   * One challenge's hint list, from the current player's perspective —
   * backs useChallengeHints(challengeId). Parameterized because a
   * different challengeId is genuinely different, independently
   * cacheable data, the same reasoning challengeKeys.detail(slug) and
   * auditKeys.detail(id) already establish elsewhere in this project.
   */
  challenge: (challengeId: string) => ["hint", "challenge", challengeId] as const,
};