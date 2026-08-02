// ============================================================================
// audit.enums.ts
// ============================================================================
//
// Domain enums owned by the Audit module.
//
// Prisma owns enums that persist to the database
// (AuditAction, AuditActorType, AuditResourceType).
//
// This file owns enums that exist purely in the application layer:
//
// - severity
// - export status
// - export format
// - sort direction
// - sortable fields
//
// These are intentionally NOT Prisma enums because they are UI/service
// concepts rather than persisted domain state.
// ============================================================================

/**
 * Importance of an audit event.
 *
 * Not stored on AuditLog.
 * Derived from AUDIT_EVENTS.
 */
export enum AuditSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

/**
 * Export output formats supported by audit-export.service.ts.
 */
export enum AuditExportFormat {
  CSV = "csv",
  JSON = "json",
}

/**
 * Async export lifecycle.
 *
 * Internal service state.
 */
export enum AuditExportStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/**
 * Sort direction accepted by repository queries.
 */
export enum AuditSortDirection {
  ASC = "asc",
  DESC = "desc",
}

/**
 * Explicitly sortable columns.
 *
 * Never use keyof AuditLog.
 */
export enum AuditSortField {
  OCCURRED_AT = "occurredAt",
  SEVERITY = "severity",
  CATEGORY = "category",
  ACTION = "action",
}