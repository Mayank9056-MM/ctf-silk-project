import { Prisma } from "@/app/generated/prisma/client";
import type {
  AuditAction,
  AuditActorType,
  AuditResourceType,
  Role,
} from "@/app/generated/prisma/enums";
import type { DbClient } from "@/lib/prisma";

/** Exact column shape for a single AuditLog insert. 1:1 with the Prisma model. */
export interface CreateAuditLogInput {
  readonly actorType: AuditActorType;
  readonly actorId: string | null;
  readonly actorUsername: string | null;
  readonly actorRole: Role | null;
  readonly action: AuditAction;
  readonly success: boolean;
  readonly reason: string | null;
  readonly resourceType: AuditResourceType;
  readonly resourceId: string | null;
  readonly resourceName: string | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly requestId: string | null;
  readonly sessionId: string | null;
  /** Already redacted — see AuditDiff/AuditMetadata brands in audit.types.ts. Repository trusts the caller. */
  readonly before: Prisma.InputJsonValue | null;
  readonly after: Prisma.InputJsonValue | null;
  readonly metadata: Prisma.InputJsonValue | null;
}

/**
 * Filters this repository understands. `actions` replaces the
 * category/severity fields on audit.types.ts's AuditSearchFilters — by
 * the time a query reaches here, the service has already resolved
 * "CRITICAL events" or "SECURITY category" into a concrete action list.
 */
export interface AuditRepositoryFilters {
  readonly actions?: readonly AuditAction[];
  readonly actorId?: string;
  readonly actorType?: AuditActorType;
  readonly resourceType?: AuditResourceType;
  readonly resourceId?: string;
  readonly success?: boolean;
  /** Matched against resourceName / actorUsername / reason via case-insensitive contains. */
  readonly searchText?: string;
  readonly occurredAfter?: Date;
  readonly occurredBefore?: Date;
}

export interface AuditRepositorySort {
  readonly field: "occurredAt" | "action";
  readonly direction: "asc" | "desc";
}

export interface AuditRepositoryPagination {
  readonly page: number;
  readonly pageSize: number;
}

export interface AuditRepositorySearchResult<T> {
  readonly items: readonly T[];
  readonly totalCount: number;
}

/** Row shape for list views (AuditListItemDTO minus derived category/severity/summary). */
const LIST_SELECT = {
  id: true,
  occurredAt: true,
  action: true,
  actorType: true,
  actorId: true,
  actorUsername: true,
  actorRole: true,
  resourceType: true,
  resourceId: true,
  resourceName: true,
  success: true,
} satisfies Prisma.AuditLogSelect;

export type AuditLogListRow = Prisma.AuditLogGetPayload<{
  select: typeof LIST_SELECT;
}>;

/** Row shape for detail views — the only place the JSON columns are selected. */
const DETAIL_SELECT = {
  ...LIST_SELECT,
  reason: true,
  before: true,
  after: true,
  metadata: true,
  ipAddress: true,
  userAgent: true,
  requestId: true,
  sessionId: true,
} satisfies Prisma.AuditLogSelect;

export type AuditLogDetailRow = Prisma.AuditLogGetPayload<{
  select: typeof DETAIL_SELECT;
}>;

/** Row shape for the raw per-action statistics groupBy. */
export interface AuditActionCount {
  readonly action: AuditAction;
  readonly count: number;
}

function toNullableJsonInput(
  value: Prisma.InputJsonValue | null,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value === null ? Prisma.DbNull : value;
}

// Internal query builder

/**
 * Builds the shared `where` clause once for search/count/getStatistics,
 * so the three can never silently drift out of sync with each other —
 * a common source of "the count on the page doesn't match the rows
 * shown" bugs when filter logic is duplicated per method.
 */
function buildWhere(
  filters: AuditRepositoryFilters,
): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.actions?.length) {
    where.action = { in: filters.actions as AuditAction[] };
  }
  if (filters.actorId) {
    where.actorId = filters.actorId;
  }
  if (filters.actorType) {
    where.actorType = filters.actorType;
  }
  if (filters.resourceType) {
    where.resourceType = filters.resourceType;
  }
  if (filters.resourceId) {
    where.resourceId = filters.resourceId;
  }
  if (filters.success !== undefined) {
    where.success = filters.success;
  }
  if (filters.occurredAfter || filters.occurredBefore) {
    where.occurredAt = {
      ...(filters.occurredAfter && { gte: filters.occurredAfter }),
      ...(filters.occurredBefore && { lte: filters.occurredBefore }),
    };
  }
  if (filters.searchText) {
    // OR across the three human-readable columns actually worth free-text
    // matching — before/after/metadata are structured JSON, not prose,
    // and are deliberately excluded from this search.
    where.OR = [
      { resourceName: { contains: filters.searchText, mode: "insensitive" } },
      { actorUsername: { contains: filters.searchText, mode: "insensitive" } },
      { reason: { contains: filters.searchText, mode: "insensitive" } },
    ];
  }

  return where;
}

// Writes

/**
 * Persists a single audit event. Called on the gameplay hot path (e.g.
 * flag submission), so this stays a bare `create` — no side effects, no
 * retry logic (that's AUDIT_PERFORMANCE.WRITE_RETRY_* territory, owned
 * by the service's write-buffer flush, not this method).
 */
export async function create(
  db: DbClient,
  input: CreateAuditLogInput,
): Promise<{ id: string }> {
  return db.auditLog.create({
    data: {
      ...input,
      before: toNullableJsonInput(input.before),
      after: toNullableJsonInput(input.after),
      metadata: toNullableJsonInput(input.metadata),
    },
    select: { id: true },
  });
}

/**
 * Batched insert backing the write-buffer flush (AUDIT_PERFORMANCE.
 * WRITE_BUFFER_MAX_SIZE / WRITE_BUFFER_FLUSH_INTERVAL_MS). A single
 * createMany round-trip instead of N individual inserts is the whole
 * point — this is what keeps audit writes from becoming a per-request
 * bottleneck at 2,000+ concurrent participants.
 *
 * Returns only a count: createMany cannot return generated rows in
 * Postgres, and the write-buffer caller doesn't need the ids back —
 * failures are handled by the dead-letter path (AUDIT_PERFORMANCE.
 * DEAD_LETTER_ENABLED) at the service layer, not by inspecting results here.
 */
export async function createMany(
  db: DbClient,
  inputs: readonly CreateAuditLogInput[],
): Promise<{ count: number }> {
  return db.auditLog.createMany({
    data: inputs.map((input) => ({
      ...input,
      before: toNullableJsonInput(input.before),
      after: toNullableJsonInput(input.after),
      metadata: toNullableJsonInput(input.metadata),
    })),
  });
}

// Reads

/**
 * Full detail row for a single event, including the JSON columns.
 * Deliberately separate from the list-row select — the dashboard table
 * fetches LIST_SELECT for potentially 500 rows (AUDIT_LIMITS.
 * MAX_QUERY_ROWS); this is only ever fetched for one row at a time,
 * on click-through.
 */
export async function findById(
  db: DbClient,
  id: string,
): Promise<AuditLogDetailRow | null> {
  return db.auditLog.findUnique({
    where: { id },
    select: DETAIL_SELECT,
  });
}

/**
 * The single search method backing every list/history/timeline use
 * case (see the module header note — findByResource/findByActor are
 * intentionally NOT separate methods, just this with a scoped
 * `filters.resourceId`/`filters.actorId`).
 *
 * Runs the page query and the total count concurrently rather than
 * sequentially — both are independent reads against the same `where`,
 * and there's no reason to pay two round-trip latencies back to back.
 * Safe to run concurrently even when `db` is a transaction client:
 * these are two unrelated SELECTs, not a read-then-write that needs
 * ordering guarantees.
 */
export async function search(
  db: DbClient,
  filters: AuditRepositoryFilters,
  pagination: AuditRepositoryPagination,
  sort: AuditRepositorySort,
): Promise<AuditRepositorySearchResult<AuditLogListRow>> {
  const where = buildWhere(filters);
  const skip = (pagination.page - 1) * pagination.pageSize;

  const [items, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where,
      select: LIST_SELECT,
      orderBy: { [sort.field]: sort.direction },
      skip,
      take: pagination.pageSize,
    }),
    db.auditLog.count({ where }),
  ]);

  return { items, totalCount };
}

/**
 * Standalone count, independent of a page fetch. Used for category
 * badge counts (AUDIT_CACHE.CATEGORY_COUNT_TTL_SECONDS) where the
 * dashboard only needs a number, not rows.
 */
export async function count(
  db: DbClient,
  filters: AuditRepositoryFilters,
): Promise<number> {
  return db.auditLog.count({ where: buildWhere(filters) });
}

/**
 * Raw per-action event counts within an optional date range. Returns
 * counts keyed by `action`, NOT by category/severity — see the module
 * header. audit-query.service.ts folds these into AuditStatisticsDTO's
 * byCategory/severity breakdown using its own AUDIT_EVENTS mapping.
 */
export async function getStatistics(
  db: DbClient,
  filters: Pick<AuditRepositoryFilters, "occurredAfter" | "occurredBefore">,
): Promise<readonly AuditActionCount[]> {
  const rows = await db.auditLog.groupBy({
    by: ["action"],
    where: buildWhere(filters),
    _count: { _all: true },
  });

  return rows.map((row) => ({
    action: row.action,
    count: row._count._all,
  }));
}
