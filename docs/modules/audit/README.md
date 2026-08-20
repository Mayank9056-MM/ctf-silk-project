# Audit Module

## 1. Overview

The audit module records and queries important administrative and security-relevant events.

## 2. Responsibilities

- Own the module-specific data contract, service orchestration, repository calls, and UI hooks/actions present under `modules/audit`.
- Keep client DTOs separate from Prisma records.
- Enforce authorization and validation at server boundaries where actions exist.

## 3. Non-Responsibilities

- Does not own unrelated gameplay modules.
- Does not expose protected story text, flags, answers, or secrets in documentation or DTOs.
- Does not replace service-level validation in dependent modules.

## 4. Features

Implemented: audit model/enums/constants, best-effort record service, paginated/filterable audit log actions/hooks/UI, detail view.

## 5. Architecture

```text
UI component/page
 ↓
module hook
 ↓
Server Action (where present)
 ↓
Service
 ↓
Repository / dependent service
 ↓
Prisma model(s)
```

## 6. Data Flow

The module follows the repository convention used throughout the app: actions validate and authorize, services coordinate business rules, repositories perform Prisma operations, and mappers shape DTOs.

## 7. API / Interfaces

See the `actions/` folder for Server Action names, `hooks/` for client query/mutation usage, and `types/` for DTO contracts. There is no separate REST API unless explicitly documented elsewhere.

## 8. Data Model

See [Database](../database/README.md) for complete Prisma relationships. Module-specific tables are represented in `prisma/schema.prisma` and should be extended through migrations.

## 9. State Management

Client state uses React component state and TanStack Query hooks where hooks exist. Server state is PostgreSQL via Prisma.

## 10. Security

Server-side authorization is required for privileged reads/writes. Sensitive fields should be omitted at the repository or mapper boundary. Never trust client state for game progression or admin decisions.

## 11. Error Handling

Expected domain errors are represented through `ApiError`/`ErrorCode` or action state objects. Unexpected errors are logged and should not leak internals to players.

## 12. Performance

Pagination and selective queries are used where current repository methods support them. No external cache or real-time bus is implemented for this module unless noted.

## 13. Testing

No module-specific test suite was found. Add service-level tests before changing critical flows.

## 14. Dependencies

Dependencies are explicit imports in the module's service/action files and should remain one-directional where possible.

## 15. Extension Points

Extend through validations, services, repositories, and DTO mappers together. Do not add UI-only logic for server-authoritative decisions.

## 16. Known Limitations

Request ID/session ID fields exist but are currently not propagated. Some audit enum values are placeholders for unimplemented CMS/security features.

## 17. Future Improvements

Add automated tests, operator-facing observability, and clearer separation for any feature that grows beyond the current module boundary.


## Related documentation
- [Module map](../README.md)
- [Architecture](../../architecture/README.md)
- [Security](../../security/README.md)
