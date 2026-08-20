# Dashboard Module

## 1. Overview

The dashboard module is a player-facing composition layer. It does not own domain state; it aggregates event, story, evidence, leaderboard, announcement, and notification summaries into one DTO for the dashboard UI.

## 2. Responsibilities

- Fetch event summary/countdown/access state.
- Fetch nullable story progress without bootstrapping a new story run.
- Fetch chapter map and evidence overview when available.
- Fetch current player rank and leaderboard preview.
- Fetch announcement and notification previews as optional/degradable data.
- Map the composed result into a dashboard DTO.

## 3. Non-Responsibilities

- Does not mutate gameplay state.
- Does not start story progress merely because the dashboard loads.
- Does not own announcement, notification, leaderboard, evidence, or event rules.

## 4. Features

Implemented: dashboard aggregate action/service/hook, event summary, story-progress null handling, evidence-board null handling, rank/leaderboard preview, optional announcements/notifications.

## 5. Architecture

```text
app/(protected)/dashboard/page.tsx
 ↓
Dashboard components
 ↓
modules/dashboard/hooks/use-dashboard
 ↓
getDashboard action
 ↓
DashboardService
 ↓
EventService + StoryService + EvidenceService + LeaderboardService + AnnouncementService + NotificationService
```

## 6. Data Flow

The service fetches core event/story/rank data in parallel. Expected `NOT_FOUND` states for not-started story/evidence are converted to `null`. Announcement and notification failures are logged and degraded to `null` so optional widgets do not block the dashboard.

## 7. API / Interfaces

Server Action: `getDashboard` for the authenticated user.

## 8. Data Model

No dashboard table exists. The dashboard DTO is composed from Event, StoryProgress, Evidence, LeaderboardEntry/ChallengeSolve, Announcement, and Notification data.

## 9. State Management

The dashboard hook uses TanStack Query. Countdown rendering may use local component state, but event timing authority is server-derived.

## 10. Security

The dashboard action is authenticated and self-scoped. It should never call story current-scene bootstrap as a side effect.

## 11. Error Handling

Core service failures fail the dashboard. Optional announcement/notification failures degrade to null and are logged.

## 12. Performance

Parallel composition avoids serial fan-out. The leaderboard preview size is capped by dashboard constants.

## 13. Testing

No tests found. Add tests for no-progress dashboard state, optional subsystem degradation, and self-scoping.

## 14. Dependencies

Depends on Event, Story, Evidence, Leaderboard, Announcement, Notification, Auth, and Prisma indirectly.

## 15. Extension Points

Add dashboard widgets by consuming existing domain services and marking whether the widget is core or optional/degradable.

## 16. Known Limitations

No personalized team widgets because teams are not implemented. No realtime refresh mechanism found.

## 17. Future Improvements

Add widget-level loading/error telemetry, configurable previews, and realtime leaderboard/notification updates.

## Related documentation
- [Module map](../README.md)
- [Architecture](../../architecture/README.md)
- [Security](../../security/README.md)
