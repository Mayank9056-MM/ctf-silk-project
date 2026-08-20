# Admin Module

## 1. Overview

The admin module is the operational control surface for `SUPER_ADMIN` users. It is implemented as admin pages/components plus domain-specific admin actions for event control and player management. Admin leaderboard, audit, and announcement pages reuse their owning modules rather than duplicating their business rules here.

## 2. Responsibilities

- Gate `/admin` routes through admin layout/access checks.
- Provide event pause/resume and registration enable/disable actions.
- Provide player search, player detail, ban/unban, and reset-password actions.
- Compose the admin shell, sidebar, status strip, tables, dialogs, and empty/error states.
- Delegate audit, announcement, and leaderboard behavior to their owning modules.

## 3. Non-Responsibilities

- Does not own player authentication or session issuance.
- Does not own challenge/story content management; no implemented challenge CMS or story CMS was found.
- Does not implement security alert/incident workflows even though future Prisma models exist.
- Does not bypass module services for leaderboard, audit, announcements, or notifications.

## 4. Features

Implemented: admin shell, event control card/dialogs, player table/search/status filter, ban/unban, reset player password, admin leaderboard page, audit page, and announcements page.

## 5. Architecture

```text
app/admin/* pages
 ↓
components/admin/*
 ↓
modules/admin/hooks/*
 ↓
modules/admin/actions/event-control + player-management
 ↓
EventControlService / PlayerManagementService
 ↓
EventControlRepository / PlayerManagementRepository / shared auth repositories
```

## 6. Data Flow

Admin Server Actions resolve the authenticated actor, validate input with admin schemas, assert admin access, then call services. Event-control mutations use conditional `updateMany` calls inside transactions. Player moderation uses conditional user updates, refresh-token revocation where required, best-effort audit writes, and notifications for ban events.

## 7. API / Interfaces

Event-control actions: `getEventControl`, `pauseEvent`, `resumeEvent`, `enableRegistration`, `disableRegistration`. Player-management actions: `getPlayers`, `getPlayer`, `banPlayer`, `unbanPlayer`, `resetPlayerPassword`.

## 8. Data Model

Admin operations primarily mutate `EventControl` and `User`. They also touch `RefreshToken`, `AuditLog`, and `Notification` as side effects.

## 9. State Management

Admin hooks use TanStack Query for event-control and player-management data. Dialog form state is local to admin components.

## 10. Security

Admin actions require super-admin access. Player-management repository queries intentionally scope to `Role.USER` so admin accounts are not managed through player moderation. Temporary passwords returned by reset operations are sensitive one-time operational data.

## 11. Error Handling

Invalid redundant event transitions return conflicts. Missing players return not found. Concurrent player state changes return conflicts. Audit failures are best-effort and must not be documented as guaranteed transaction rollback triggers.

## 12. Performance

Player lists are paginated and sorted deterministically. Event-control reads are singleton reads. No real-time admin operations channel exists.

## 13. Testing

No admin test suite was found. Add tests for authorization, moderation race behavior, reset revocation, and event transition idempotency/conflicts.

## 14. Dependencies

Depends on Auth, Event, Audit, Notification, Leaderboard, Announcement, and Prisma.

## 15. Extension Points

Add new admin features as thin admin actions that delegate to the owning domain service. Do not turn the admin module into a second business-logic implementation.

## 16. Known Limitations

No challenge CMS, story CMS, team admin, bulk moderation, security alert UI, incident workflow, or export UI was found.

## 17. Future Improvements

Add richer operator dashboards, audit correlation, exports, and explicit runbooks for live-event interventions.

## Related documentation
- [Module map](../README.md)
- [Architecture](../../architecture/README.md)
- [Security](../../security/README.md)
