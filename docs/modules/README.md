# Module Map

The current implementation exposes these meaningful modules:

| Module | Status | Purpose |
|---|---:|---|
| [Authentication](auth/README.md) | Implemented | Registration, login, logout, refresh, cookies, password hashing, authorization helpers. |
| [Users / player management](users/README.md) | Implemented | User model plus admin player search, ban/unban, and password reset. |
| [Events](events/README.md) | Implemented | Singleton event, derived access state, countdowns, pause/resume, registration toggle. |
| [Challenges](challenges/README.md) | Implemented | Challenge catalog, metadata, prerequisites, gated player access, attachment serving. |
| [Submissions](submissions/README.md) | Implemented | Flag attempts, validation, correct solve creation, story advancement, scoring write. |
| [Leaderboard](leaderboard/README.md) | Implemented | Live/frozen rankings, rank lookup, admin live view, freeze/unfreeze. |
| [Story / investigation](story/README.md) | Implemented | Chapters, scenes, dialogue, choices, evidence, unlock rules, progress. |
| [Hints](hints/README.md) | Implemented | Published challenge hints, sequential unlocks, XP cost deduction. |
| [Announcements](announcements/README.md) | Implemented | Admin-created messages surfaced to dashboard. |
| [Notifications](notifications/README.md) | Implemented | Per-user notifications and read state. |
| [Dashboard](dashboard/README.md) | Implemented | Player overview composition across modules. |
| [Admin](admin/README.md) | Implemented | Operational shell, event control, player management, admin leaderboard/audit/announcements. |
| [Audit](audit/README.md) | Implemented | Audit schema, event constants, recording, query UI. |
| [Database](database/README.md) | Implemented | Prisma schema, migrations, generated client, seed/reset scripts. |

Planned / future modules visible only as permissions or schema include teams and security operations alerts/incidents.
