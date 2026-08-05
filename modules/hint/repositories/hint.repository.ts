import type { Hint, PlayerHint } from "@/app/generated/prisma/client";
import { ContentStatus } from "@/app/generated/prisma/enums";
import type { DbClient } from "@/lib/prisma";

import type { HintWithPlayerState } from "../types/hint.types";

// ============================================================================
// hint.repository.ts
// ============================================================================
//
// Pure persistence for the Hint module — nothing here decides whether an
// unlock is ALLOWED, only what's actually stored. hint.service.ts owns
// every business rule (unlock order, XP affordability, the three-hint
// cap); this file only ever answers "what does the database say."
//
// WHY BUSINESS LOGIC NEVER BELONGS HERE
// ------------------------------------------
// A method here can't correctly enforce "previous hint required" without
// importing HINT_UNLOCK_ORDER and reasoning about it — the moment it
// did, this module would have the same rule expressed in two places
// (constants + repository) with nothing forcing them to stay in sync.
// Every rule lives in exactly one place: hint.service.ts.
//
// WHY THIS FILE HAS NO createHint/updateHint/deleteHint/publishHint
// -----------------------------------------------------------------------
// There is no runtime path that ever writes a Hint row. Authoring
// happens exactly once, before deployment, via scripts/seed-hints.ts —
// which talks to Prisma directly, not through this repository, since it
// runs outside the request lifecycle this repository pattern exists to
// serve. Adding CRUD methods here because Prisma makes it easy to would
// be building an API surface with zero callers.
//
// WHY PlayerHint PERSISTENCE LIVES IN THE SAME FILE
// -------------------------------------------------------
// PlayerHint is this module's one genuine runtime write — reading Hint
// content and writing a player's unlock history are two sides of the
// same feature, the same reasoning submission.repository.ts already
// applied consolidating Submission + ChallengeSolve into one file
// instead of two.
//
// METHODS DELIBERATELY NOT INCLUDED, AND WHY
// -----------------------------------------------
// - findPlayerHint() — every fact it would answer ("has this player
//   already unlocked this hint") is already present in
//   findChallengeHints()'s joined result. The real concurrency-safety
//   net for a double-unlock race is PlayerHint's own composite primary
//   key, caught as P2002 by the service — the same pattern this project
//   already uses for ChallengeSolve/SceneCompletion/ChoiceSelection —
//   not a repository pre-check.
// - findUnlockedHints() — a strict subset of findChallengeHints()'s
//   result, derivable by the service filtering an array it already has
//   in memory. A second round trip for information already in hand
//   isn't persistence, it's waste.
// - countChallengeHints() — every real caller either already has the
//   full array (so .length is free) or has no need for a count at all
//   independent of the hints themselves.
// ============================================================================

class HintRepository {
  /**
   * Every published hint for one challenge, paired with THIS player's
   * own unlock record for each one (or null, if they haven't unlocked
   * it). A single query, not two — the join happens here specifically
   * so hint.service.ts never has to make a second round trip just to
   * learn what it already needs to decide unlock eligibility.
   *
   * ASSUMPTION: relies on a back-relation field named `playerHints` on
   * the Hint model, pointing to PlayerHint[]. If the real schema names
   * this relation differently, only the `include` clause below changes.
   *
   * `playerHints[0] ?? null` below is safe, not just convenient —
   * PlayerHint's composite primary key (userId, hintId) makes more than
   * one row for this exact user+hint pair impossible at the database
   * level. The array shape only exists because Prisma models this as a
   * one-to-many relation; there is never more than one element in it
   * once `where: { userId }` has already scoped it to one player.
   *
   * Ordered by level ascending — relies on HintLevel being declared in
   * the schema as LEVEL_1, LEVEL_2, LEVEL_3 in that order, since
   * Postgres enum columns sort by declaration order, not alphabetically.
   * hint.constants.ts's HINT_UNLOCK_ORDER documents this same sequence
   * for the service layer; this repository doesn't import that constant
   * (repositories don't depend on constants), it only relies on the
   * same underlying schema fact being true.
   */
  async findChallengeHints(
    db: DbClient,
    userId: string,
    challengeId: string,
  ): Promise<readonly HintWithPlayerState[]> {
    const rows = await db.hint.findMany({
      where: {
        challengeId,
        status: ContentStatus.PUBLISHED,
      },
      include: {
        playerHints: {
          where: { userId },
        },
      },
      orderBy: { level: "asc" },
    });

    return rows.map(({ playerHints, ...hint }) => ({
      hint: hint as Hint,
      playerHint: playerHints[0] ?? null,
    }));
  }

  /**
   * A bare, unjoined lookup by id — filtered to PUBLISHED, matching
   * every other player-facing repository method in this codebase (see
   * Story's own findPublishedScene/findPublishedEvidence precedent).
   * Exists specifically as the unlock flow's first step: the action
   * likely receives only a hintId, and the service needs to learn which
   * challenge it belongs to before it can call findChallengeHints with
   * the right scope.
   *
   * Uses findUnique, not findFirst — `id` is the primary key, so this
   * was always a point lookup, never a "first matching row among
   * several" query. findUnique says what's actually happening here;
   * combining the unique field with the additional `status` filter in
   * the same where clause is supported directly, so this isn't just a
   * rename, it's the more precise API for the query it always was.
   *
   * The PUBLISHED filter stays at THIS layer deliberately, not moved to
   * the service — it's not a business rule the way unlock order or XP
   * affordability are (neither depends on which player is asking).
   * It's a content-visibility guarantee that should hold unconditionally
   * for every caller, the same "structural, not disciplinal" reasoning
   * this project already applies to flagHash omission: pushed into the
   * one shared function every caller goes through, not left for a
   * service to remember to apply after the fact. Without it here, a
   * client could resolve a DRAFT hint's id directly and bypass the same
   * guarantee findChallengeHints already provides for the list path.
   */
  async findHintById(db: DbClient, hintId: string): Promise<Hint | null> {
    return db.hint.findUnique({
      where: {
        id: hintId,
        status: ContentStatus.PUBLISHED,
      },
    });
  }

  /**
   * Persists a newly unlocked hint. Does NOT validate order, does NOT
   * check affordability, does NOT deduct XP from wherever a player's
   * balance actually lives — the service has already decided all of
   * that by the time this is called, inside its own transaction. This
   * is a pure insert, and `db` is expected to be a transaction client
   * (`tx`) in the real unlock flow, not the top-level `prisma` singleton,
   * so this write commits atomically with whatever XP-deduction write
   * the service performs alongside it.
   *
   * `unlockedAt` is deliberately not a parameter — assumed to be a
   * database-level default (`@default(now())`), the same pattern this
   * project already uses for other unlock-moment timestamps, rather
   * than a value the caller has to remember to supply correctly.
   */
  async createPlayerHint(
    db: DbClient,
    data: Pick<PlayerHint, "userId" | "hintId" | "xpSpent">,
  ): Promise<PlayerHint> {
    return db.playerHint.create({ data });
  }
}

export const hintRepository = new HintRepository();
