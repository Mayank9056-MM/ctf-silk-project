// ============================================================================
// audit.dto.ts
// ============================================================================
//
// PUBLIC DTOs — Action → Frontend / Admin Dashboard boundary only.
//
// Every field here is intentionally display-ready: dates are ISO strings
// (not `Date`, for the same explicit-serialization reasoning as before),
// metadata/before/after are the BRANDED types from audit.types.ts (proof,
// not just documentation, that redaction already happened before this DTO
// was constructed), and actor/resource identity is already resolved to a
// renderable label.
//
// A DTO must never be constructed directly from a Prisma row or from an
// audit.types.ts domain type by spreading/casting — always through an
// explicit mapper in utils/audit.mapper.ts. That mapper is the one place
// allowed to decide "does the frontend get this field."
// ============================================================================

import type {
  AuditAction,
  AuditActorType,
  AuditResourceType,
} from "@/app/generated/prisma/enums";
import type { AuditCategory } from "../constants/audit.categories";
import type { AuditMetadata, AuditSnapshot } from "./audit.types";
import {
  AuditExportFormat,
  AuditExportStatus,
  AuditSeverity,
} from "./audit.enums";

// ----------------------------------------------------------------------------
// Actor / Resource — display-ready identity
// ----------------------------------------------------------------------------

/**
 * Display-ready actor identity. `label` is pre-resolved by the mapper
 * (e.g. "ethan_c (Admin)" or "System") so the frontend never has to
 * branch on `type` to decide HOW to render an actor — that logic lives
 * once, in the mapper. `type` itself still reuses AuditActorType directly
 * (not a hand-copied string union) so a future fourth actor type can
 * never silently diverge between this DTO and the schema it's sourced
 * from — same reasoning already applied to AuditResourceDTO below.
 */
export interface AuditActorDTO {
  readonly id: string | null;
  readonly label: string;
  readonly type: AuditActorType;
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
 * A single row in the admin audit table. Deliberately lean — no
 * before/after, no full metadata — since this renders for every row of a
 * potentially 500-row page (AUDIT_LIMITS.MAX_QUERY_ROWS) and must stay
 * small. Clicking a row fetches AuditDetailDTO separately.
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
  /** Pre-rendered from AUDIT_EVENTS[key].description — never derived from the enum key in the frontend. */
  readonly summary: string;
}

/**
 * The full detail view for a single audit entry. NOT declared as
 * `extends AuditListItemDTO` — independent contracts on purpose, so
 * trimming a field from one view can never accidentally affect the other.
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
  /**
   * Branded types, not loose Record<string, unknown> — a DTO carrying
   * unredacted data literally cannot type-check as AuditMetadata/
   * AuditSnapshot, so this is a compile-time guarantee, not a
   * convention the mapper has to remember to honor.
   */
  readonly metadata: AuditMetadata | null;
  readonly before: AuditSnapshot | null;
  readonly after: AuditSnapshot | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly requestId: string | null;
}

// ----------------------------------------------------------------------------
// Timeline view
// ----------------------------------------------------------------------------

/**
 * Powers every resource/actor-scoped history use case (challenge
 * history, story CMS history, player timeline, admin history) — all of
 * which are now ONE query shape (audit-query.service.ts's
 * queryAuditLog(), filtered differently per case), not four separate
 * services. `dayLabel` is pre-bucketed here rather than in the
 * component layer, so four different timeline screens don't each
 * reimplement the same date-grouping logic.
 */
export interface AuditTimelineDTO {
  readonly subjectLabel: string; // e.g. "Challenge: The Ledger" or "Agent ethan_c"
  readonly entries: readonly AuditTimelineEntryDTO[];
}

export interface AuditTimelineEntryDTO {
  readonly id: string;
  readonly occurredAt: string;
  readonly dayLabel: string; // e.g. "August 2, 2026"
  readonly action: AuditAction;
  readonly severity: AuditSeverity;
  readonly actor: AuditActorDTO;
  readonly summary: string;
}

// ----------------------------------------------------------------------------
// Export
// ----------------------------------------------------------------------------

/**
 * Status of an export job as shown to the admin who requested it.
 * Deliberately excludes `filePath` (server-side storage path) — only
 * `downloadUrl`, a signed/short-lived link, is exposed.
 */
export interface AuditExportDTO {
  readonly id: string;
  readonly status: AuditExportStatus;
  readonly format: AuditExportFormat;
  readonly rowCount: number | null;
  readonly downloadUrl: string | null;
  readonly errorMessage: string | null;
  readonly expiresAt: string | null; // ISO 8601
}

// ----------------------------------------------------------------------------
// Statistics / dashboard summaries
// ----------------------------------------------------------------------------

/** Per-category count for the filter sidebar badges (e.g. "Security (12)"). Pulls label/color from AUDIT_CATEGORY_METADATA — never hardcoded in the dashboard. */
export interface AuditCategorySummaryDTO {
  readonly category: AuditCategory;
  readonly label: string;
  readonly color: string;
  readonly count: number;
  readonly percentageOfTotal: number;
}

export interface AuditStatisticsDTO {
  readonly totalEvents: number;
  readonly rangeStart: string;
  readonly rangeEnd: string;
  readonly byCategory: readonly AuditCategorySummaryDTO[];
  readonly criticalCount: number;
  readonly warningCount: number;
}

// ----------------------------------------------------------------------------
// Search response envelope
// ----------------------------------------------------------------------------

export interface AuditPaginationDTO {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

/**
 * The top-level return shape of get-audit-log.ts — the ONE action now
 * covering search, challenge history, story history, player timeline,
 * and admin history (see the folder-structure consolidation this module
 * was reviewed against). No action here should ever return
 * AuditListItemDTO[] bare; pagination metadata always travels with it.
 */
export interface AuditSearchResponseDTO {
  readonly items: readonly AuditListItemDTO[];
  readonly pagination: AuditPaginationDTO;
}
