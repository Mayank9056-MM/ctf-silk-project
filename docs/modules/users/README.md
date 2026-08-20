# Users / Player Management Module

## 1. Overview

The user model is shared by authentication, gameplay, scoring, story progress, notifications, and admin operations. Player management is the admin-facing module for searching users, banning/unbanning players, and resetting player passwords.

## 2. Responsibilities

- Store user identity, role, status, password state, lockout state, and relationships.
- Provide admin-only paginated player lookup.
- Ban and unban player accounts.
- Reset player passwords and revoke refresh tokens where appropriate.

## 3. Non-Responsibilities

- Does not own registration/login mechanics; auth owns them.
- Does not own score calculation; leaderboard/submission own scoring.
- Does not implement teams despite team permissions existing.

## 4. Features

Implemented: player search by username/email/full name, status filtering, deterministic pagination, player detail, ban/unban, password reset with temporary password returned to admin, refresh-token revocation on ban/reset.

## 5. Architecture

```text
Admin players UI
 ↓
player-management hooks/actions
 ↓
PlayerManagementService
 ↓
PlayerManagementRepository + UserRepository + RefreshTokenRepository
 ↓
User / RefreshToken / AuditLog / Notification
```

## 6. Data Flow

Admin actions build an audit actor from the authenticated user, validate inputs, and call the service. Status changes use conditional updates to avoid races. Banning revokes sessions and attempts to create a notification.

## 7. API / Interfaces

Server Actions: `getPlayers`, `getPlayer`, `banPlayer`, `unbanPlayer`, `resetPlayerPassword`. All are admin-only through `assertCanAccessAdmin`/super-admin capability checks.

## 8. Data Model

`UserStatus` is `ACTIVE` or `BANNED`. `Role` is `USER` or `SUPER_ADMIN`. The player-management repository intentionally scopes player queries to `Role.USER` so admin accounts are not managed through the player tooling.

## 9. State Management

Admin hooks use TanStack Query keys from `modules/admin/constants` and invalidate player lists/details after mutations.

## 10. Security

Admin-only. Password hashes are omitted from player-management queries. Ban/reset revoke refresh tokens. Temporary reset passwords are sensitive and should be displayed once, never logged or stored in documentation.

## 11. Error Handling

Missing/non-player IDs return not found. Duplicate/redundant state transitions return conflicts. Concurrency-lost transitions return conflicts instructing admins to refresh.

## 12. Performance

Player listing uses paginated Prisma `findMany` plus `count`, deterministic ordering, and indexed user fields where available.

## 13. Testing

No automated tests were found. Add tests for admin authorization, password reset session revocation, ban race handling, and query filters.

## 14. Dependencies

Depends on Auth repositories/services, Audit, Notification, Prisma, and admin access utilities.

## 15. Extension Points

Add additional moderation states only after defining login/session behavior and audit events. Keep admin-user management separate from player-user management.

## 16. Known Limitations

No self-service profile management route was found. Team management is planned only by permission names.

## 17. Future Improvements

Add moderation reason storage, bulk actions, CSV export, admin activity details, and player profile pages.


## Related documentation
- [Documentation index](../../README.md)
- [Architecture](../../architecture/README.md)
- [Security](../../security/README.md)
- [Development](../../development/README.md)
