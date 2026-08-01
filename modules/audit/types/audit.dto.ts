// ============================================================================
// audit.dto.ts
// ============================================================================
//
// PUBLIC DTOs — Action → Frontend / Admin Dashboard boundary only.
//
// Every field here is intentionally display-ready: dates are ISO strings
// (not `Date`, which doesn't survive the Server Action → Client Component
// serialization boundary the same way across all Next.js versions —
// making it explicit here removes any ambiguity), metadata is already
// redacted, and actor/resource identity is already resolved to a
// renderable label. The dashboard should never need to import a domain
// type or a formatting util to render one of these.
//
// A DTO must never be constructed directly from a Prisma row or from an
// `audit.types.ts` domain type by spreading/casting — always through an
// explicit mapper in `utils/audit.mapper.ts`. That mapper is the one
// place allowed to decide "does the frontend get this field."
// ============================================================================

import type {
  AuditAction,
  AuditResourceType,
} from "@/app/generated/prisma/enums";
import type { AuditCategory } from "../constants/audit.categories";
import type { AuditSeverity } from "../constants/audit.events";

// ----------------------------------------------------------------------------
// Actor / Resource — display-ready identity
// ----------------------------------------------------------------------------

/**
 * Display-ready actor identity for the dashboard. `label` is pre-resolved
 * by the mapper (e.g. "ethan_c (Admin)" or "System") so the frontend
 * never has to branch on `actorType` to decide how to render an actor —
 * that branching logic lives once, in the mapper, not scattered across
 * every table/detail component that shows an actor.
 */
export interface AuditActorDTO {
  readonly id: string | null;
  readonly label: string;
  readonly type: "USER" | "ADMIN" | "SYSTEM";
}

/** Display-ready resource identity — same rationale as AuditActorDTO. */
export interface AuditResourceDTO {
  readonly id: string | null;
  readonly label: string;
  readonly type: AuditResourceType;
}

// ----------------------------------------------------------------------------
// List / detail views
// ----------------------------------------------------------------------------

/**
 * A single row in the admin audit table. Kept deliberately lean — no
 * `before`/`after`, no full metadata — because this shape is rendered
 * for every row of a potentially 500-row page (AUDIT_LIMITS.MAX_QUERY_ROWS)
 * and must stay small. Clicking a row fetches `AuditDetailDTO` separately.
 */
export interface AuditListItemDTO {
  readonly id: string;
  readonly occurredAt: string; // ISO 8601
  readonly action: AuditAction;
  readonly category: AuditCategory;
  readonly severity: AuditSeverity;
  readonly actor: AuditActorDTO;
  readonly resource: AuditResourceDTO;
  readonly success: boolean;
  /** Pre-rendered from AUDIT_EVENTS[key].description — the dashboard never derives copy from the enum key itself. */
  readonly summary: string;
}

/**
 * The full detail view shown when an admin expands/drills into a single
 * audit entry. Extends the list item's fields conceptually but is NOT
 * declared as `extends AuditListItemDTO` — the two are independent
 * contracts on purpose, so trimming a field from the list view can never
 * accidentally remove it from the detail view or vice versa.
 */
export interface AuditDetailDTO {
  readonly id: string;
  readonly occurredAt: string;
  readonly action: AuditAction;
  readonly category: AuditCategory;
  readonly severity: AuditSeverity;
  readonly actor: AuditActorDTO;
  readonly resource: AuditResourceDTO;
  readonly success: boolean;
  readonly reason: string | null;
  readonly summary: string;
  /** Already redacted — safe to render directly in a JSON viewer. */
  readonly metadata: Readonly<Record<string, unknown>> | null;
  readonly before: Readonly<Record<string, unknown>> | null;
  readonly after: Readonly<Record<string, unknown>> | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly requestId: string | null;
}

// ----------------------------------------------------------------------------
// Timeline view
// ----------------------------------------------------------------------------

/**
 * Powers the resource-scoped and player-scoped history views
 * (`get-challenge-history`, `get-story-history`, `get-player-timeline`,
 * `get-admin-history`). A flat chronological list rather than the raw
 * `AuditListItemDTO[]` because the timeline UI groups by day and needs a
 * pre-computed `dayLabel` bucket — computing that in the component layer
 * would duplicate the same date-bucketing logic across four different
 * timeline screens.
 */
export interface AuditTimelineDTO {
  readonly subjectLabel: string; // e.g. "Challenge: The Ledger" or "Agent ethan_c"
  readonly entries: readonly AuditTimelineEntryDTO[];
}

export interface AuditTimelineEntryDTO {
  readonly id: string;
  readonly occurredAt: string;
  readonly dayLabel: string; // pre-bucketed, e.g. "August 2, 2026"
  readonly action: AuditAction;
  readonly severity: AuditSeverity;
  readonly actor: AuditActorDTO;
  readonly summary: string;
}

// ----------------------------------------------------------------------------
// Export
// ----------------------------------------------------------------------------

/**
 * Status of an export job as shown to the admin who requested it (e.g.
 * a polling widget after triggering `export-audit-log.ts`). Deliberately
 * excludes `filePath` (a server-side storage path) — only `downloadUrl`,
 * a signed/short-lived link, is exposed.
 */
export interface AuditExportDTO {
  readonly id: string;
  readonly status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  readonly format: "csv" | "json";
  readonly rowCount: number | null;
  readonly downloadUrl: string | null;
  readonly errorMessage: string | null;
  readonly expiresAt: string | null; // ISO 8601
}

// ----------------------------------------------------------------------------
// Statistics / dashboard summaries
// ----------------------------------------------------------------------------

/** Per-category count used to render the filter sidebar badges (e.g. "Security (12)"). Pulls label/color from AUDIT_CATEGORY_METADATA so the dashboard never hardcodes category display info. */
export interface AuditCategorySummaryDTO {
  readonly category: AuditCategory;
  readonly label: string;
  readonly color: string;
  readonly count: number;
  readonly percentageOfTotal: number;
}

/** Top-level stats panel on the admin audit dashboard. */
export interface AuditStatisticsDTO {
  readonly totalEvents: number;
  readonly rangeStart: string; // ISO 8601
  readonly rangeEnd: string;
  readonly byCategory: readonly AuditCategorySummaryDTO[];
  readonly criticalCount: number;
  readonly warningCount: number;
}

// ----------------------------------------------------------------------------
// Search response envelope
// ----------------------------------------------------------------------------

/** Pagination metadata as rendered by the dashboard's table footer/pager controls. */
export interface AuditPaginationDTO {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

/**
 * The top-level return shape of `search-audit.ts` and `get-audit-log.ts`.
 * This is the ONE type those actions are allowed to return — no action
 * in this module should return `AuditListItemDTO[]` bare, since the
 * dashboard always needs pagination metadata alongside the rows.
 */
export interface AuditSearchResponseDTO {
  readonly items: readonly AuditListItemDTO[];
  readonly pagination: AuditPaginationDTO;
}
