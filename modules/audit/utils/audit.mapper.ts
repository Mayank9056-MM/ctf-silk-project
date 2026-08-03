// ============================================================================
// audit.mapper.ts
// ============================================================================
//
// The ONLY translation layer between Prisma rows (audit.repository.ts's
// AuditLogListRow / AuditLogDetailRow / AuditActionCount) and the DTOs the
// frontend consumes (audit.dto.ts).
//
// Pure functions only: Date → ISO string, action → category/severity/summary
// (via AUDIT_EVENTS), row → display-ready DTO. No Prisma, no queries, no
// logging, no validation, no business decisions. If a function here needs
// to decide something rather than transform something, it belongs in
// audit-query.service.ts instead.
// ============================================================================

import type {
  AuditLogListRow,
  AuditLogDetailRow,
  AuditActionCount,
} from "../repositories/audit.repository";
import {
  AUDIT_EVENTS,
  type AuditEventDefinition,
} from "../constants/audit.events";
import {
  AUDIT_CATEGORY_LIST,
  AUDIT_CATEGORY_METADATA,
  type AuditCategory,
} from "../constants/audit.categories";
import { AuditSeverity, AuditExportStatus } from "../types/audit.enums";
import type {
  AuditActorDTO,
  AuditResourceDTO,
  AuditListItemDTO,
  AuditDetailDTO,
  AuditTimelineDTO,
  AuditTimelineEntryDTO,
  AuditCategorySummaryDTO,
  AuditStatisticsDTO,
  AuditPaginationDTO,
  AuditSearchResponseDTO,
  AuditExportDTO,
} from "../types/audit.dto";
import type {
  AuditSnapshot,
  AuditMetadata,
  AuditExportJob,
} from "../types/audit.types";
import type {
  AuditAction,
  AuditActorType,
  AuditResourceType,
} from "@/app/generated/prisma/enums";

// ----------------------------------------------------------------------------
// Event definition lookup
// ----------------------------------------------------------------------------

/**
 * action → definition index, built once at module load rather than
 * `Object.values(AUDIT_EVENTS).find(...)`-ing on every row of a 500-row
 * page. AUDIT_EVENTS's own compile-time exhaustiveness check (see the
 * bottom of audit.events.ts) guarantees every AuditAction has an entry,
 * so a lookup miss here is a broken invariant, not a normal "not found."
 */
const EVENT_DEFINITIONS_BY_ACTION: ReadonlyMap<
  AuditAction,
  AuditEventDefinition
> = new Map(Object.values(AUDIT_EVENTS).map((def) => [def.action, def]));

/**
 * Looks up an action's static definition. Throws rather than returning
 * undefined: AUDIT_EVENTS's exhaustiveness check makes a miss here a
 * programmer error (an action was added to the Prisma enum without a
 * matching AUDIT_EVENTS entry, or that check was bypassed), not a
 * recoverable business condition — same fail-fast reasoning as the
 * invariant assertions in audit.constants.ts.
 */
function getEventDefinition(action: AuditAction): AuditEventDefinition {
  const definition = EVENT_DEFINITIONS_BY_ACTION.get(action);
  if (!definition) {
    throw new Error(
      `[audit.mapper] No AUDIT_EVENTS definition registered for action "${action}".`,
    );
  }
  return definition;
}

// ----------------------------------------------------------------------------
// Actor / Resource labels
// ----------------------------------------------------------------------------

/**
 * Converts a SCREAMING_SNAKE_CASE enum value into a human label
 * ("UNLOCK_RULE" → "Unlock Rule"). Used as the fallback resource label
 * when resourceName is null (e.g. a resource that no longer exists, or
 * a SYSTEM-scoped event with no specific row) — the dashboard should
 * show "Challenge" rather than a blank cell or the raw enum string.
 */
function humanizeEnumValue(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Builds the display label for whoever triggered the event.
 * actorUsername is a denormalized snapshot (see AuditActor's docs in
 * audit.types.ts) captured at write time, so this never joins to the
 * live User table — a renamed or deleted user still renders correctly
 * for historical rows.
 */
function toActorLabel(
  actorType: AuditActorType,
  actorUsername: string | null,
): string {
  if (actorType === "SYSTEM") return "System";
  return actorUsername ?? `(deleted ${actorType.toLowerCase()})`;
}

function toResourceLabel(
  resourceType: AuditResourceType,
  resourceName: string | null,
): string {
  return resourceName ?? humanizeEnumValue(resourceType);
}

export function toAuditActorDTO(
  row: Pick<AuditLogListRow, "actorType" | "actorId" | "actorUsername">,
): AuditActorDTO {
  return {
    id: row.actorId,
    label: toActorLabel(row.actorType, row.actorUsername),
    type: row.actorType,
  };
}

export function toAuditResourceDTO(
  row: Pick<AuditLogListRow, "resourceType" | "resourceId" | "resourceName">,
): AuditResourceDTO {
  return {
    id: row.resourceId,
    label: toResourceLabel(row.resourceType, row.resourceName),
    type: row.resourceType,
  };
}

// ----------------------------------------------------------------------------
// JSON column trust boundary
// ----------------------------------------------------------------------------

/**
 * Casts a Prisma JsonValue into the branded AuditSnapshot/AuditMetadata
 * types. This is a TRUST, not a re-validation: redaction (stripping
 * anything matching /hash/i, etc.) happens exactly once, in
 * utils/audit-redactor.ts, before the value is ever written to the DB
 * — see audit.types.ts's AuditMetadata/AuditDiff docs. By the time a
 * row reaches this mapper, the data is already safe; this function just
 * gives the compiler proof of that via the brand, it does not itself
 * enforce it.
 */
function toSnapshot(value: unknown): AuditSnapshot | null {
  return value === null ? null : (value as AuditSnapshot);
}

function toMetadata(value: unknown): AuditMetadata | null {
  return value === null ? null : (value as AuditMetadata);
}

// ----------------------------------------------------------------------------
// List / detail DTOs
// ----------------------------------------------------------------------------

export function toAuditListItemDTO(row: AuditLogListRow): AuditListItemDTO {
  const definition = getEventDefinition(row.action);

  return {
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    action: row.action,
    category: definition.category,
    severity: definition.severity,
    actor: toAuditActorDTO(row),
    resource: toAuditResourceDTO(row),
    success: row.success,
    summary: definition.description,
  };
}

export function toAuditDetailDTO(row: AuditLogDetailRow): AuditDetailDTO {
  const definition = getEventDefinition(row.action);

  return {
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    action: row.action,
    category: definition.category,
    severity: definition.severity,
    actor: toAuditActorDTO(row),
    resource: toAuditResourceDTO(row),
    success: row.success,
    reason: row.reason,
    summary: definition.description,
    metadata: toMetadata(row.metadata),
    before: toSnapshot(row.before),
    after: toSnapshot(row.after),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    requestId: row.requestId,
  };
}

// ----------------------------------------------------------------------------
// Timeline DTOs
// ----------------------------------------------------------------------------

/**
 * "August 2, 2026" — the day-bucket header used by every timeline view
 * (challenge history, player history, admin history). Computed here,
 * once, so four different timeline screens never each reimplement their
 * own date-grouping/formatting and drift apart visually.
 */
function toDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function toAuditTimelineEntryDTO(
  row: AuditLogListRow,
): AuditTimelineEntryDTO {
  const definition = getEventDefinition(row.action);

  return {
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    dayLabel: toDayLabel(row.occurredAt),
    action: row.action,
    severity: definition.severity,
    actor: toAuditActorDTO(row),
    summary: definition.description,
  };
}

/**
 * subjectLabel is passed in rather than derived here — "Challenge: The
 * Ledger" vs. "Agent ethan_c" depends on WHICH scoped query produced
 * these rows (resource history vs. actor history), a decision the
 * service already made when it built the filter. The mapper has no way
 * to infer that from rows alone if the result set happens to be empty.
 */
export function toAuditTimelineDTO(
  subjectLabel: string,
  rows: readonly AuditLogListRow[],
): AuditTimelineDTO {
  return {
    subjectLabel,
    entries: rows.map(toAuditTimelineEntryDTO),
  };
}

// ----------------------------------------------------------------------------
// Statistics DTOs
// ----------------------------------------------------------------------------

export function toAuditCategorySummaryDTO(
  category: AuditCategory,
  count: number,
  totalEvents: number,
): AuditCategorySummaryDTO {
  const metadata = AUDIT_CATEGORY_METADATA[category];

  return {
    category,
    label: metadata.label,
    color: metadata.color,
    count,
    // Guard against div-by-zero on an empty result set rather than
    // letting NaN leak into the dashboard's percentage bars.
    percentageOfTotal:
      totalEvents === 0 ? 0 : Math.round((count / totalEvents) * 100),
  };
}

/**
 * Rolls repository's raw per-action counts (AuditActionCount[]) up into
 * per-category and per-severity totals. This rollup is what the module
 * header on audit.repository.ts explicitly deferred to "the service, via
 * the mapper" — the repository only ever returns counts grouped by the
 * one column that actually exists, `action`.
 */
export function toAuditStatisticsDTO(
  actionCounts: readonly AuditActionCount[],
  rangeStart: Date,
  rangeEnd: Date,
): AuditStatisticsDTO {
  const countsByCategory = new Map<AuditCategory, number>();
  let criticalCount = 0;
  let warningCount = 0;
  let totalEvents = 0;

  for (const { action, count } of actionCounts) {
    const definition = getEventDefinition(action);
    totalEvents += count;

    countsByCategory.set(
      definition.category,
      (countsByCategory.get(definition.category) ?? 0) + count,
    );

    if (definition.severity === AuditSeverity.CRITICAL) criticalCount += count;
    if (definition.severity === AuditSeverity.WARNING) warningCount += count;
  }

  return {
    totalEvents,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    // Every category is represented, even at zero — the dashboard's
    // filter sidebar renders a fixed set of checkboxes ("Security (0)")
    // rather than a list that reflows as categories go quiet.
    byCategory: AUDIT_CATEGORY_LIST.map((category) =>
      toAuditCategorySummaryDTO(
        category,
        countsByCategory.get(category) ?? 0,
        totalEvents,
      ),
    ),
    criticalCount,
    warningCount,
  };
}

// ----------------------------------------------------------------------------
// Pagination / search response DTOs
// ----------------------------------------------------------------------------

export function toAuditPaginationDTO(
  page: number,
  pageSize: number,
  totalCount: number,
): AuditPaginationDTO {
  const totalPages = pageSize === 0 ? 0 : Math.ceil(totalCount / pageSize);

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function toAuditSearchResponseDTO(
  rows: readonly AuditLogListRow[],
  page: number,
  pageSize: number,
  totalCount: number,
): AuditSearchResponseDTO {
  return {
    items: rows.map(toAuditListItemDTO),
    pagination: toAuditPaginationDTO(page, pageSize, totalCount),
  };
}

// ----------------------------------------------------------------------------
// Export DTO
// ----------------------------------------------------------------------------

/**
 * downloadUrl is a parameter, not derived from `job` — AuditExportJob
 * only carries the server-side `filePath`; turning that into a signed,
 * short-lived download URL requires calling a storage SDK, which is
 * I/O and therefore the export service's job, not this pure mapper's.
 */
export function toAuditExportDTO(
  job: AuditExportJob,
  downloadUrl: string | null,
): AuditExportDTO {
  return {
    id: job.id,
    status: job.status,
    format: job.format,
    rowCount: job.rowCount,
    downloadUrl:
      job.status === AuditExportStatus.COMPLETED ? downloadUrl : null,
    errorMessage: job.errorMessage,
    expiresAt: job.expiresAt ? job.expiresAt.toISOString() : null,
  };
}
