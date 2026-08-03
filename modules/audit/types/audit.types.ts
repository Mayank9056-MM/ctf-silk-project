import type {
  AuditAction,
  AuditActorType,
  AuditResourceType,
  Role,
} from "@/app/generated/prisma/enums";
import type { AuditCategory } from "../constants/audit.categories";
import {
  AuditExportFormat,
  AuditExportStatus,
  AuditSeverity,
} from "./audit.enums";

// ----------------------------------------------------------------------------
// Actor / Resource — who did it, what did it happen to
// ----------------------------------------------------------------------------

/**
 * The identity of whoever (or whatever) triggered an audit event.
 *
 * Deliberately separate from the Prisma `User` relation: an actor is a
 * point-in-time identity claim, not a live foreign key. `actorId` can be
 * null (SYSTEM-initiated events have no user), and `username`/`role` are
 * captured as plain strings rather than joined at read time — see
 * `AuditSnapshot` below for why that matters for a deleted/renamed user.
 *
 * Used by: repository (constructing a row to persist), service (building
 * `AuditRecordInput`), utils/audit-formatter.ts (rendering "who did this").
 */
export interface AuditActor {
  readonly actorType: AuditActorType;
  readonly actorId: string | null;
  readonly actorUsername: string | null;
  readonly actorRole: Role | null;
}

/**
 * The thing an audit event happened to. Intentionally untyped-by-resource
 * (no discriminated union per resourceType) because the audit module must
 * stay decoupled from every domain module's shape — it should not need to
 * import Challenge/Scene/Evidence types just to describe "this happened to
 * a Challenge." `resourceName` is a denormalized label captured at write
 * time for exactly the same reason as AuditActor.actorUsername below.
 */
export interface AuditResource {
  readonly resourceType: AuditResourceType;
  readonly resourceId: string | null;
  readonly resourceName: string | null;
}

// ----------------------------------------------------------------------------
// Snapshots and diffs
// ----------------------------------------------------------------------------

/**
 * A point-in-time capture of an actor or resource's display identity at
 * the moment the event occurred (e.g. `{ username: "ethan_c", role: "USER" }`
 * or `{ title: "Chapter 3: The Ledger", slug: "chapter-3" }`).
 *
 * Why this exists: `AuditActor.actorId` / `AuditResource.resourceId` are
 * foreign keys that can go stale — a user can be renamed, a challenge can
 * be retitled or deleted entirely. Without a snapshot, an audit entry from
 * six months ago would render as "someone did something to (deleted)."
 * The snapshot is what actually gets persisted to `AuditLog.actorSnapshot`
 * / `AuditLog.resourceSnapshot` and is what history views read from —
 * never the live relation.
 *
 * Generic over a plain record because the shape legitimately differs per
 * actor/resource type; it is NOT a place to smuggle arbitrary business
 * data — see `AuditMetadata` for that.
 */
export type AuditSnapshot = Readonly<
  Record<string, string | number | boolean | null>
>;

export interface AuditDiff {
  readonly before: AuditSnapshot;
  readonly after: AuditSnapshot;
}

export type AuditMetadata = Readonly<Record<string, unknown>> & {
  readonly __redacted: true;
};


// Request context


export interface AuditRequestContext {
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly requestId: string | null;
  readonly sessionId: string | null;
}

// Write path

/**
 * The single input shape `audit.service.ts` builds and hands to
 * `audit.repository.ts` to persist a new AuditLog row. This is the
 * contract that replaces "pass eight loose arguments to writeAuditLog()."
 *
 * Deliberately does NOT include `category`/`severity`/`description` as
 * free-form fields — those are derived from the `AUDIT_EVENTS[key]`
 * definition by the service, not supplied ad hoc by call sites, which is
 * what guarantees every LOGIN event has identical category/severity
 * regardless of which of the ~10 call sites triggered it.
 */
export interface AuditRecordInput {
  readonly eventKey: string; // keyof typeof AUDIT_EVENTS, kept as string to avoid a circular import with audit.events.ts
  readonly actor: AuditActor;
  readonly resource: AuditResource;
  readonly context: AuditRequestContext;
  readonly success: boolean;
  readonly reason?: string;
  readonly diff?: AuditDiff;
  readonly metadata?: AuditMetadata;
}

// ----------------------------------------------------------------------------
// Query path — filters, pagination, sort
// ----------------------------------------------------------------------------

/**
 * All filterable dimensions for an audit search. Every field is optional
 * — an empty `AuditSearchFilters` means "everything within the enforced
 * default/max search window" (see AUDIT_LIMITS.MAX_SEARCH_WINDOW_DAYS).
 *
 * Built by validation schemas from raw query params; consumed by the
 * repository to construct the Prisma `where` clause. This is the ONE
 * place filter semantics are defined — the repository must not invent
 * additional filtering logic beyond what's expressible here.
 */
export interface AuditSearchFilters {
  readonly categories?: readonly AuditCategory[];
  readonly severities?: readonly AuditSeverity[];
  readonly actions?: readonly AuditAction[];
  readonly actorId?: string;
  readonly actorType?: AuditActorType;
  readonly resourceType?: AuditResourceType;
  readonly resourceId?: string;
  readonly success?: boolean;
  readonly searchText?: string;
  readonly occurredAfter?: Date;
  readonly occurredBefore?: Date;
}

/** Offset pagination for the admin dashboard's audit table. */
export interface AuditPagination {
  readonly page: number;
  readonly pageSize: number;
}

/** Sortable columns are deliberately enumerated, not `keyof AuditLog`, to keep the sortable surface intentional rather than accidentally exposing every column. */
export interface AuditSort {
  readonly field: "occurredAt" | "severity" | "category" | "action";
  readonly direction: "asc" | "desc";
}

/**
 * The fully-assembled query the service passes to the repository for a
 * single `findMany`. Composing filters/pagination/sort into one type
 * (rather than three loose parameters) keeps the repository's public
 * method signature stable as new filter dimensions are added.
 */
export interface AuditQuery {
  readonly filters: AuditSearchFilters;
  readonly pagination: AuditPagination;
  readonly sort: AuditSort;
}

/**
 * Generic paginated result wrapper returned by the repository's search
 * method. Generic over `T` because it's reused for both the raw domain
 * row shape (repository → service) and, after mapping, is mirrored (not
 * reused) by `AuditSearchResponseDTO` in audit.dto.ts — the DTO layer
 * intentionally does NOT extend or reference this type directly.
 */
export interface AuditSearchResult<T> {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasNextPage: boolean;
}

// ----------------------------------------------------------------------------
// Export path
// ----------------------------------------------------------------------------

/** Options accepted by `audit-export.service.ts` when generating a CSV/JSON export. */
export interface AuditExportOptions {
  readonly format: AuditExportFormat;
  readonly filters: AuditSearchFilters;
  readonly includeMetadata: boolean;
  readonly requestedBy: AuditActor;
}

/**
 * The lifecycle state of an async export job (see
 * AUDIT_EXPORT.ASYNC_THRESHOLD_ROWS — large exports run as a background
 * job rather than inline). Tracked internally by the export service;
 * only a redacted view of this (`AuditExportDTO`) ever reaches the
 * dashboard.
 */
export interface AuditExportJob {
  readonly id: string;
  readonly status: AuditExportStatus;
  readonly format: AuditExportFormat;
  readonly requestedByActorId: string | null;
  readonly rowCount: number | null;
  readonly filePath: string | null;
  readonly errorMessage: string | null;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
  readonly expiresAt: Date | null;
}

// ----------------------------------------------------------------------------
// Retention
// ----------------------------------------------------------------------------

/**
 * A resolved retention policy for a given category, produced by combining
 * `AUDIT_RETENTION_BY_CATEGORY` with `AUDIT_RETENTION.DEFAULT_RETENTION_DAYS`.
 * Modeled as a type here (rather than only living as constants) because
 * the retention/archival cron job needs to reason about it as a value —
 * e.g. compute `expiresAt` per row, decide soft- vs hard-delete eligibility.
 */
export interface AuditRetentionPolicy {
  readonly category: AuditCategory;
  readonly retentionDays: number;
  readonly softDeleteGracePeriodDays: number;
}

// ----------------------------------------------------------------------------
// Statistics
// ----------------------------------------------------------------------------

/**
 * Aggregate counts consumed by `audit-query.service.ts` when building
 * dashboard summary views. This is the internal, unshaped aggregation
 * result — `AuditStatisticsDTO` in audit.dto.ts formats it for display
 * (e.g. adds percentage-of-total, category labels/colors).
 */
export interface AuditStatistics {
  readonly totalEvents: number;
  readonly countsByCategory: ReadonlyMap<AuditCategory, number>;
  readonly countsBySeverity: ReadonlyMap<AuditSeverity, number>;
  readonly rangeStart: Date;
  readonly rangeEnd: Date;
}
