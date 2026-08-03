import type { z } from "zod";
import type { AuditResourceType } from "@/app/generated/prisma/enums";

import type { getAuditSchema } from "../validations/get-audit.schema";

/**
 * The raw, pre-validation shape a caller assembles for list(). Derived
 * via z.input from getAuditSchema itself — not a hand-written mirror of
 * its fields — so this file can never drift from what get-audit-log.ts's
 * own Zod parse actually accepts.
 */
type AuditListRequest = z.input<typeof getAuditSchema>;

/**
 * TanStack Query key registry for the Audit module. Flat tuples with
 * `as const`, matching challengeKeys/leaderboardKeys/storyKeys — no
 * nested factory helper, since none of those files use one either.
 */
export const auditKeys = {
  /**
   * Root key. Not consumed by any hook today (no audit write path exists
   * yet — audit.repository.ts is create-only), but the natural target
   * if a future mutation ever needs to invalidate every audit query at
   * once.
   */
  all: ["audit"] as const,

  /**
   * Groups every list query under one prefix, separate from detail/
   * statistics/history — same reasoning as leaderboardKeys.page sitting
   * apart from myRank/userRank: invalidating "all lists" should never
   * touch a detail lookup.
   */
  lists: () => ["audit", "list"] as const,

  /**
   * Parameterized by the whole filters/pagination/sort request rather
   * than spread across separate tuple elements like
   * leaderboardKeys.page(page, pageSize) — there's no small, fixed set
   * of primitives here to spread; filters/pagination/sort are each
   * their own sub-object. A different request is genuinely different,
   * independently cacheable data, same reasoning as
   * challengeKeys.detail(slug).
   */
  list: (request: AuditListRequest) => ["audit", "list", request] as const,

  /** Same shape as challengeKeys.detail(slug) — one row per id. */
  detail: (id: string) => ["audit", "detail", id] as const,

  /**
   * Fixed key, matching storyKeys.progress's reasoning for "the
   * caller's current state" rather than a parameterized read. If a
   * date-range parameter is ever added to the statistics hook, this key
   * will need one too — flagged rather than solved here since no
   * statistics hook exists yet to exercise it.
   */
  statistics: () => ["audit", "statistics"] as const,

  /**
   * Parameterized by resourceType + resourceId, matching
   * storyKeys.replayScene(sceneId)'s reasoning — a resource's history is
   * genuinely different data per resource, so this can't be a single
   * fixed key the way statistics() is.
   */
  history: (resourceType: AuditResourceType, resourceId: string) =>
    ["audit", "history", resourceType, resourceId] as const,
};