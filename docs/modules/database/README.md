# Database Module

## 1. Overview

The database layer is PostgreSQL accessed through Prisma 7. The schema defines auth, event, challenge, submission, leaderboard, story, hint, announcement, notification, audit, admin-control, and planned security-operation models.

## 2. Responsibilities

- Define persistent models/enums/relationships in `prisma/schema.prisma`.
- Maintain migrations under `prisma/migrations`.
- Generate Prisma Client into `app/generated/prisma`.
- Provide seed/reset scripts for local/event setup.
- Enforce uniqueness and relational integrity for critical gameplay invariants.

## 3. Non-Responsibilities

- Does not encode all domain authorization rules; services do that.
- Does not provide production backup/restore automation.
- Does not validate untyped `UnlockRule.referenceId` relationships at the database level.

## 4. Features

Implemented: PostgreSQL datasource, Prisma generated client config, migration history, local Docker Postgres, seed scripts for event/story/challenges/users/admin/announcements/hints/attachments, and reset script.

## 5. Architecture

```text
Domain repositories
 ↓
lib/prisma.ts DbClient
 ↓
Generated Prisma Client in app/generated/prisma
 ↓
PostgreSQL
```

## 6. Data Flow

Repositories receive either the global Prisma client or a transaction client. Services open transactions when a use case spans multiple tables, such as submissions updating solves/leaderboard or hint unlocks deducting XP.

## 7. API / Interfaces

Developer commands: `npx prisma generate`, `npx prisma migrate deploy`, `npm run db:reset`, and `npm run seed*` scripts documented in development docs.

## 8. Data Model

Core relationships include `User` to auth/gameplay records, singleton `Event` to `EventControl`, `Chapter` to `Scene`/`Challenge`, `Challenge` to submissions/solves/hints/attachments/prerequisites, and admin/audit operational tables.

## 9. State Management

The database is the source of truth. In-memory story cache is an optimization for selected published content reads, not authoritative mutable state.

## 10. Security

Sensitive values such as passwords, refresh tokens, and flags are stored as hashes. Raw secrets must not be inserted into docs or logs. Prisma parameterized raw queries are used for leaderboard ranking/upserts.

## 11. Error Handling

Prisma unique-constraint errors are used as authoritative race protection in solve and hint flows. Missing singleton seed rows fail critical services closed.

## 12. Performance

Indexes support audit filters, rate-limit expiry, submissions, leaderboard ordering, story scene/chapter ordering, hints, notifications, and admin queries. Frozen leaderboard aggregation may need a snapshot table at larger scale.

## 13. Testing

No database integration test suite found. Add migration tests, seed smoke tests, and transaction/race tests for gameplay invariants.

## 14. Dependencies

All domain modules depend on Prisma models either directly through repositories or indirectly through services.

## 15. Extension Points

Schema changes require Prisma migrations, generated-client updates, seed updates where content-backed, and documentation updates.

## 16. Known Limitations

Single-event assumption, untyped unlock references, no team schema, no production backup scripts, and planned-but-unimplemented security operations tables.

## 17. Future Improvements

Add backup/restore runbooks, migration CI, seed validation, and materialized leaderboard snapshots for high-scale events.

## Related documentation
- [Module map](../README.md)
- [Architecture](../../architecture/README.md)
- [Security](../../security/README.md)
