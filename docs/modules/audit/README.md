# Audit Module

## 1. Overview

The audit module provides persistent records for administrative and security-relevant domain events and admin-facing audit-log query views.

## 2. Responsibilities

- Define audit action/resource/actor taxonomy.
- Record audit events from domain services.
- Redact structured metadata before persistence where applicable.
- Provide paginated/filterable audit reads and detail lookups.
- Support admin audit UI through actions/hooks/DTOs.

## 3. Non-Responsibilities

- Does not replace typed domain tables such as `Submission`, `ChallengeSolve`, or `PlayerHint`.
- Does not guarantee every domain mutation is audited.
- Does not currently propagate request IDs or session IDs.
- Does not implement external SIEM forwarding.

## 4. Features

Implemented: `AuditLog` schema, enums/constants, best-effort record service, audit query service, list/detail actions, filters, hooks, and admin table/detail UI.

## 5. Architecture

```text
Domain service mutation
 ↓
auditService.record(...)
 ↓
AuditRepository
 ↓
AuditLog table

Admin audit page
 ↓
Audit hooks/actions
 ↓
AuditQueryService
 ↓
AuditRepository
```

## 6. Data Flow

Domain services build an `AuditActor` and event key, then call the record service. Query actions validate filters and require audit permission before returning DTOs to the admin UI.

## 7. API / Interfaces

Server Actions: `getAuditLog`, `getAuditLogById`. Service interface: `record(...)` and system-event helpers where implemented.

## 8. Data Model

`AuditLog` stores actor identity snapshot, action, success flag, reason, resource type/id/name, request metadata placeholders, redacted before/after/metadata JSON, and timestamp.

## 9. State Management

Admin audit filters and selected detail state are UI-level. Audit data is fetched through TanStack Query hooks.

## 10. Security

Audit reads are admin-only. Audit metadata can contain sensitive operational context, so redaction is required before storing structured payloads.

## 11. Error Handling

The record service is best-effort in current code: callers should not assume failed audit writes roll back domain writes unless the error is explicitly propagated by the calling service.

## 12. Performance

Indexes exist for occurrence time, actor, action, resource type, and resource ID. Query UI should remain paginated.

## 13. Testing

No tests found. Add tests for filter validation, redaction, permission denial, and best-effort failure behavior.

## 14. Dependencies

Used by Auth, Admin, Announcement, Leaderboard, Story restart, and future security operations.

## 15. Extension Points

Add new auditable actions by updating enum/constants, then wire recording at the domain service that owns the mutation.

## 16. Known Limitations

Request/session IDs are provisioned but not populated. Some enum values are for unimplemented CMS/security workflows.

## 17. Future Improvements

Add request correlation, export tooling, retention policy, external forwarding, and integrity checks.

## Related documentation
- [Module map](../README.md)
- [Architecture](../../architecture/README.md)
- [Security](../../security/README.md)
