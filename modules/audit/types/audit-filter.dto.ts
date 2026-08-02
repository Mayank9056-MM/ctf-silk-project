// ============================================================================
// audit-filter.dto.ts
// ============================================================================
//
// CLIENT → ACTION boundary INPUT contract — the mirror image of
// audit.dto.ts. Every list/search/export entry point (get-audit-log.ts,
// export-audit-log.ts) accepts one of these, never AuditSearchFilters/
// AuditQuery (audit.types.ts) directly.
//
// Deliberately distinct from AuditSearchFilters even though the fields
// overlap heavily: this is the UNVALIDATED shape a client can actually
// construct and pass across the Server Action boundary — every field is
// a plain serializable primitive (dates are ISO strings, not Date; no
// cross-field invariants enforced, e.g. nothing here stops
// occurredAfter > occurredBefore). get-audit.schema.ts's Zod schema is
// the ONLY place that turns this into the validated, properly-typed
// AuditSearchFilters/AuditQuery the repository actually receives.
//
// This exists so validation has a concrete input shape to validate FROM
// — not so a caller can skip validation by constructing something
// "typed enough" and passing it straight to the service.
// ============================================================================

import type { AuditAction, AuditActorType, AuditResourceType } from "@/app/generated/prisma/enums";
import type { AuditCategory } from "../constants/audit.categories";
import { AuditSeverity } from "./audit.enums";

/**
 * Every filterable dimension, all optional, all pre-validation. An empty
 * object means "everything within the enforced default/max search
 * window" (AUDIT_LIMITS.MAX_SEARCH_WINDOW_DAYS, AUDIT_DEFAULTS.DEFAULT_LOOKBACK_DAYS)
 * — the schema layer fills that default in, this type doesn't.
 */
export interface AuditFilterInput {
  readonly categories?: readonly AuditCategory[];
  readonly severities?: readonly AuditSeverity[];
  readonly actions?: readonly AuditAction[];
  readonly actorId?: string;
  readonly actorType?: AuditActorType;
  readonly resourceType?: AuditResourceType;
  readonly resourceId?: string;
  readonly success?: boolean;
  /** Validated against AUDIT_SEARCH.MIN_QUERY_LENGTH/MAX_SEARCH_TERMS before use — not enforced by this type. */
  readonly searchText?: string;
  /** ISO 8601 — the client-safe primitive form. Parsed to Date only inside get-audit.schema.ts, never here. */
  readonly occurredAfter?: string;
  readonly occurredBefore?: string;
}

export interface AuditPaginationInput {
  readonly page?: number;
  readonly pageSize?: number;
}

/**
 * Sortable columns enumerated explicitly, matching AuditSort in
 * audit.types.ts — kept as two separate declarations (not one shared
 * type) since a schema change to the internal AuditSort's allowed
 * fields shouldn't silently also change what a client is allowed to
 * request without that being a deliberate decision at the input layer.
 */
export interface AuditSortInput {
  readonly field?: "occurredAt" | "severity" | "category" | "action";
  readonly direction?: "asc" | "desc";
}

/**
 * The single input shape get-audit-log.ts accepts. Composing filter/
 * pagination/sort into one object — mirroring AuditQuery's own
 * composition in audit.types.ts — keeps the action's public signature
 * stable as new filter dimensions are added.
 */
export interface AuditFilterRequest {
  readonly filters?: AuditFilterInput;
  readonly pagination?: AuditPaginationInput;
  readonly sort?: AuditSortInput;
}

/**
 * export-audit-log.ts's input. Filters/sort apply identically to an
 * export as to a search — only `format`/`includeMetadata` are
 * export-specific, so this doesn't redeclare filters/sort, it reuses
 * the same fields.
 */
export interface AuditExportRequest {
  readonly filters?: AuditFilterInput;
  readonly sort?: AuditSortInput;
  readonly format: "csv" | "json";
  readonly includeMetadata: boolean;
}

/**
 * Convenience shape for the resource/actor-scoped history use cases
 * (get-challenge-history's former role, now folded into get-audit-log.ts)
 * — a single required scoping value, everything else defaulted.
 * Constructing an AuditFilterRequest from this is the caller's job (a
 * thin wrapper in audit-query.service.ts, if one earns its name — see
 * the folder-structure discussion on not renaming a one-line call).
 */
export interface AuditHistoryRequest {
  readonly resourceType?: AuditResourceType;
  readonly resourceId?: string;
  readonly actorId?: string;
  readonly pagination?: AuditPaginationInput;
}