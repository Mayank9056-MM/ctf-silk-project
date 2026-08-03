// ============================================================================
// audit-query.service.ts
// ============================================================================
//
// The read counterpart to audit.service.ts. Owns every query/search/
// pagination/statistics operation against AuditLog. No create/update/
// delete of any kind lives here — see audit.repository.ts's own header
// ("create-only, no update/delete by id ever") for why that's enforced
// one layer down too, not just by convention in this file.
//
// Two contract gaps between audit.types.ts (what a client can ask for)
// and audit.repository.ts (what Postgres can actually answer) are
// resolved here, once, rather than left for every call site to
// rediscover:
//   1. AuditSearchFilters exposes categories/severities; the repository
//      only understands a concrete `actions` list. This service builds
//      that resolution off AUDIT_EVENTS (see resolveActionFilter below).
//   2. AuditSort's field union includes "severity"/"category", but
//      those are derived per-row at read time (see audit.mapper.ts),
//      not real AuditLog columns — Prisma's orderBy cannot express
//      them. Requesting either is rejected via ApiError rather than
//      silently downgraded to an occurredAt sort.
// ============================================================================

import prisma from "@/lib/prisma";
import type {
  AuditAction,
  AuditResourceType,
} from "@/app/generated/prisma/enums";
import type { DbClient } from "@/lib/prisma";
import { auditLogger as log } from "@/lib/logger/logger.scopes";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

import {
  AUDIT_EVENTS,
  type AuditEventDefinition,
} from "../constants/audit.events";
import { AUDIT_DEFAULTS, AUDIT_LIMITS } from "../constants/audit.constants";
import { AuditSeverity, AUDIT_SEVERITY_ORDER } from "../types/audit.enums";
import type {
  AuditSearchFilters,
  AuditPagination,
  AuditSort,
} from "../types/audit.types";
import {
  search,
  findById,
  getStatistics,
  type AuditRepositoryFilters,
  type AuditRepositoryPagination,
  type AuditRepositorySort,
} from "../repositories/audit.repository";
import {
  toAuditSearchResponseDTO,
  toAuditDetailDTO,
  toAuditStatisticsDTO,
  toAuditTimelineDTO,
  toAuditActorDTO,
  toAuditResourceDTO,
} from "../utils/audit.mapper";
import type {
  AuditSearchResponseDTO,
  AuditDetailDTO,
  AuditStatisticsDTO,
  AuditTimelineDTO,
  AuditListItemDTO,
} from "../types/audit.dto";

// ----------------------------------------------------------------------------
// AUDIT_EVENTS reverse indices — category/severity → actions
// ----------------------------------------------------------------------------

/**
 * Widening cast, same trick as getAuditEventDefinition() in
 * audit.events.ts: AUDIT_EVENTS's `as const satisfies` combination
 * makes Object.values() infer a union of per-entry literal types
 * rather than AuditEventDefinition. Every entry structurally satisfies
 * the interface (confirmed by `satisfies` at its declaration), so this
 * widening is always a legal assignment — it only matters for the
 * *access* pattern below, not for building an index over required
 * (non-optional) fields like category/severity/action.
 */
const EVENT_DEFINITIONS: readonly AuditEventDefinition[] = Object.values(
  AUDIT_EVENTS,
) as readonly AuditEventDefinition[];

function buildActionIndex<K>(
  keyOf: (definition: AuditEventDefinition) => K,
): ReadonlyMap<K, readonly AuditAction[]> {
  const index = new Map<K, AuditAction[]>();
  for (const definition of EVENT_DEFINITIONS) {
    const key = keyOf(definition);
    const bucket = index.get(key) ?? [];
    bucket.push(definition.action);
    index.set(key, bucket);
  }
  return index;
}

const ACTIONS_BY_CATEGORY = buildActionIndex((d) => d.category);
const ACTIONS_BY_SEVERITY = buildActionIndex((d) => d.severity);

function severitiesAtOrAbove(
  minSeverity: AuditSeverity,
): readonly AuditSeverity[] {
  const index = AUDIT_SEVERITY_ORDER.indexOf(minSeverity);
  return AUDIT_SEVERITY_ORDER.slice(index === -1 ? 0 : index);
}

// ----------------------------------------------------------------------------
// Filter / sort / pagination resolution
// ----------------------------------------------------------------------------

interface ResolvedActionFilter {
  /** false = no action-based restriction requested at all. */
  readonly restricted: boolean;
  /** Only meaningful when `restricted` is true — may legitimately be empty. */
  readonly actions: readonly AuditAction[];
}

/**
 * Intersects filters.actions / filters.categories / filters.severities
 * (whichever were supplied) into one concrete action list. Returning an
 * empty array here is a real, meaningful result — "these filters
 * combined match nothing" — and is handled explicitly by the caller
 * rather than forwarded to the repository (see queryAuditLog's short-
 * circuit below for why that distinction matters).
 */
function resolveActionFilter(
  filters: AuditSearchFilters,
): ResolvedActionFilter {
  const sets: AuditAction[][] = [];

  if (filters.actions?.length) {
    sets.push([...filters.actions]);
  }
  if (filters.categories?.length) {
    sets.push(
      filters.categories.flatMap(
        (category) => ACTIONS_BY_CATEGORY.get(category) ?? [],
      ),
    );
  }
  if (filters.severities?.length) {
    sets.push(
      filters.severities.flatMap(
        (severity) => ACTIONS_BY_SEVERITY.get(severity) ?? [],
      ),
    );
  }

  if (sets.length === 0) {
    return { restricted: false, actions: [] };
  }

  const [first, ...rest] = sets;
  const intersection = rest.reduce(
    (acc, set) => acc.filter((action) => set.includes(action)),
    first,
  );

  return { restricted: true, actions: intersection };
}

/**
 * AuditSort permits "severity"/"category" per audit.types.ts's own
 * documented client-facing contract, but neither is a real AuditLog
 * column — both are derived from `action` via AUDIT_EVENTS at read
 * time. Rejecting here (rather than downgrading to occurredAt) keeps
 * "the rows are right but the order is wrong" from ever happening
 * silently.
 */
function toRepositorySort(sort: AuditSort): AuditRepositorySort {
  if (sort.field === "occurredAt" || sort.field === "action") {
    return { field: sort.field, direction: sort.direction };
  }

  throw ApiError.badRequest(
    ErrorCode.VALIDATION_ERROR,
    `Sorting by "${sort.field}" is not supported — only "occurredAt" and "action" are backed by real columns. Category/severity are derived per-row and cannot be pushed into the database sort.`,
  );
}

/**
 * Re-clamps pageSize even though get-audit.schema.ts should already
 * enforce AUDIT_LIMITS.MAX_QUERY_ROWS — the same "don't trust a single
 * call site to remember the ceiling" reasoning already applied to
 * flagHash omission and rate-limit identifier hashing elsewhere in
 * this codebase.
 */
function toRepositoryPagination(
  pagination: AuditPagination,
): AuditRepositoryPagination {
  const page = Math.max(1, Math.trunc(pagination.page));
  const pageSize = Math.min(
    Math.max(1, Math.trunc(pagination.pageSize)),
    AUDIT_LIMITS.MAX_QUERY_ROWS,
  );
  return { page, pageSize };
}

/**
 * AUDIT_LIMITS.MAX_SEARCH_WINDOW_DAYS applies to any query — but only
 * enforceable when BOTH bounds are supplied; a query with only one
 * bound (or neither) still returns a bounded number of ROWS via
 * pagination, even though the underlying COUNT(*) can still scan a
 * wide range. That gap is real and not fixed here — flagged the same
 * way StoryProgress's missing completedSceneCount was flagged rather
 * than silently patched with an invented default date range that
 * would change a caller's query semantics without them asking for it.
 */
function assertDateRangeWithinLimit(
  occurredAfter?: Date,
  occurredBefore?: Date,
): void {
  if (!occurredAfter || !occurredBefore) return;

  const spanDays =
    (occurredBefore.getTime() - occurredAfter.getTime()) / 86_400_000;

  if (spanDays > AUDIT_LIMITS.MAX_SEARCH_WINDOW_DAYS) {
    throw ApiError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      `Date range cannot exceed ${AUDIT_LIMITS.MAX_SEARCH_WINDOW_DAYS} days.`,
    );
  }
}

// ----------------------------------------------------------------------------
// Mapper error boundary
// ----------------------------------------------------------------------------

/**
 * Wraps a mapper call that can throw via getEventDefinition() (an
 * AuditLog row referencing an action with no AUDIT_EVENTS entry —
 * "should never happen" per the compile-time exhaustiveness check
 * today, but a future entry removal while old rows still reference it
 * would make this a live runtime hazard). Logged because it's a real
 * data-integrity signal worth on-call attention, then RETHROWN —
 * unlike audit.service.ts's write path, a read failure must propagate
 * to the caller rather than degrade silently; there is no "gameplay
 * must continue" reason to swallow a broken query the way there is
 * for a broken write.
 */
function mapOrLog<T>(fn: () => T, context: Record<string, unknown>): T {
  try {
    return fn();
  } catch (error) {
    log.error(
      "Audit mapper failed — likely a row referencing an action no longer registered in AUDIT_EVENTS",
      error,
      context,
    );
    throw error;
  }
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

/**
 * The one generic search backing every list/filter/pagination use
 * case. Callers pass already-validated AuditSearchFilters/AuditPagination/
 * AuditSort — validation itself lives in get-audit.schema.ts, upstream
 * of this service, per the project's standing "no validation inside
 * services" rule.
 */
export async function queryAuditLog(
  filters: AuditSearchFilters,
  pagination: AuditPagination,
  sort: AuditSort,
): Promise<AuditSearchResponseDTO> {
  const db = prisma;

  assertDateRangeWithinLimit(filters.occurredAfter, filters.occurredBefore);

  const resolvedActions = resolveActionFilter(filters);
  const repoPagination = toRepositoryPagination(pagination);

  if (resolvedActions.restricted && resolvedActions.actions.length === 0) {
    // Contradictory filters (e.g. a category + severity combination
    // with zero overlapping actions) resolve to "no possible match."
    // Short-circuited here rather than forwarded to the repository:
    // buildWhere() only applies `filters.actions` when non-empty (see
    // audit.repository.ts), so passing [] through would be silently
    // IGNORED and return the whole table — the opposite of correct.
    return toAuditSearchResponseDTO(
      [],
      repoPagination.page,
      repoPagination.pageSize,
      0,
    );
  }

  const repoFilters: AuditRepositoryFilters = {
    actions: resolvedActions.restricted ? resolvedActions.actions : undefined,
    actorId: filters.actorId,
    actorType: filters.actorType,
    resourceType: filters.resourceType,
    resourceId: filters.resourceId,
    success: filters.success,
    searchText: filters.searchText,
    occurredAfter: filters.occurredAfter,
    occurredBefore: filters.occurredBefore,
  };
  const repoSort = toRepositorySort(sort);

  const { items, totalCount } = await search(
    db,
    repoFilters,
    repoPagination,
    repoSort,
  );

  return mapOrLog(
    () =>
      toAuditSearchResponseDTO(
        items,
        repoPagination.page,
        repoPagination.pageSize,
        totalCount,
      ),
    { fn: "queryAuditLog", itemCount: items.length },
  );
}

/** Single-row detail lookup. Returns null on a miss — the action layer decides whether that's a 404; this is a normal empty state, not an error. */
export async function getAuditDetail(
  id: string,
): Promise<AuditDetailDTO | null> {
  const db = prisma;
  const row = await findById(db, id);
  if (!row) return null;

  return mapOrLog(() => toAuditDetailDTO(row), { fn: "getAuditDetail", id });
}
/**
 * Dashboard aggregate — defaults the range to AUDIT_DEFAULTS.
 * DEFAULT_LOOKBACK_DAYS ending now, folds the repository's raw
 * per-action counts into per-category/severity totals via the mapper
 * (the rollup audit.repository.ts's own header explicitly defers to
 * "the service, via the mapper").
 */
export async function getAuditStatistics(
  db: DbClient,
  range?: { readonly occurredAfter?: Date; readonly occurredBefore?: Date },
): Promise<AuditStatisticsDTO> {
  const rangeEnd = range?.occurredBefore ?? new Date();
  const rangeStart =
    range?.occurredAfter ??
    new Date(
      rangeEnd.getTime() - AUDIT_DEFAULTS.DEFAULT_LOOKBACK_DAYS * 86_400_000,
    );

  assertDateRangeWithinLimit(rangeStart, rangeEnd);

  const actionCounts = await getStatistics(db, {
    occurredAfter: rangeStart,
    occurredBefore: rangeEnd,
  });

  return mapOrLog(
    () => toAuditStatisticsDTO(actionCounts, rangeStart, rangeEnd),
    { fn: "getAuditStatistics", rangeStart, rangeEnd },
  );
}

/**
 * Chronological history for one resource (Challenge/Story CMS
 * timelines both reduce to this — see the "omitted methods" note on
 * why there's no separate generic getTimeline()). Calls the repository
 * directly rather than routing through queryAuditLog: toAuditTimelineDTO
 * expects raw AuditLogListRow[], not the already-mapped
 * AuditListItemDTO[] queryAuditLog returns — the two DTO shapes are
 * independent by design (see AuditTimelineDTO's own doc comment).
 */
export async function getResourceHistory(
  db: DbClient,
  resourceType: AuditResourceType,
  resourceId: string,
  pagination: AuditPagination = { page: 1, pageSize: AUDIT_DEFAULTS.PAGE_SIZE },
): Promise<AuditTimelineDTO> {
  const repoPagination = toRepositoryPagination(pagination);
  const repoSort: AuditRepositorySort = {
    field: "occurredAt",
    direction: "desc",
  };

  const { items } = await search(
    db,
    { resourceType, resourceId },
    repoPagination,
    repoSort,
  );

  // Falls back to the raw resourceType when there's no history yet —
  // there's no row to pull a human label from, and duplicating the
  // mapper's private humanizeEnumValue() here for a zero-row edge case
  // isn't worth a second place that has to agree on "how to prettify
  // an enum."
  const subjectLabel =
    items.length > 0 ? toAuditResourceDTO(items[0]).label : resourceType;

  return mapOrLog(() => toAuditTimelineDTO(subjectLabel, items), {
    fn: "getResourceHistory",
    resourceType,
    resourceId,
  });
}

/** Chronological history for one actor (Player/Admin timelines). Same rationale as getResourceHistory above. */
export async function getActorHistory(
  db: DbClient,
  actorId: string,
  pagination: AuditPagination = { page: 1, pageSize: AUDIT_DEFAULTS.PAGE_SIZE },
): Promise<AuditTimelineDTO> {
  const repoPagination = toRepositoryPagination(pagination);
  const repoSort: AuditRepositorySort = {
    field: "occurredAt",
    direction: "desc",
  };

  const { items } = await search(db, { actorId }, repoPagination, repoSort);

  const subjectLabel =
    items.length > 0 ? toAuditActorDTO(items[0]).label : "Unknown Actor";

  return mapOrLog(() => toAuditTimelineDTO(subjectLabel, items), {
    fn: "getActorHistory",
    actorId,
  });
}

/**
 * The admin-home "recent activity" feed, floored at AUDIT_DEFAULTS.
 * ACTIVITY_FEED_MIN_SEVERITY so routine INFO noise doesn't bury what
 * an admin should actually notice at a glance. Implemented as a thin
 * call into queryAuditLog rather than a parallel repository call —
 * one query path, not two.
 */
export async function getRecentEvents(
  options: {
    readonly minSeverity?: AuditSeverity;
    readonly limit?: number;
  } = {},
): Promise<readonly AuditListItemDTO[]> {
  const minSeverity =
    options.minSeverity ??
    (AUDIT_DEFAULTS.ACTIVITY_FEED_MIN_SEVERITY as AuditSeverity);

  const limit = Math.min(
    options.limit ?? AUDIT_DEFAULTS.PAGE_SIZE,
    AUDIT_LIMITS.MAX_QUERY_ROWS,
  );

  const response = await queryAuditLog(
    { severities: severitiesAtOrAbove(minSeverity) },
    { page: 1, pageSize: limit },
    { field: "occurredAt", direction: "desc" },
  );

  return response.items;
}
