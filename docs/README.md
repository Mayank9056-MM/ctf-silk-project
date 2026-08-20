# CTF Silk Road Documentation

This documentation describes the current implementation of **CTF Silk Road / The Silk Road Investigation** as a production software system. It intentionally documents mechanics and architecture without reproducing protected story text, challenge answers, flags, clues, or evidence contents.

## Navigation

```text
Documentation
├── Architecture
│   ├── System overview
│   ├── Application architecture
│   ├── Data flow
│   ├── Security architecture
│   └── Architectural decisions
├── Modules
│   ├── Authentication
│   ├── Users / player management
│   ├── Events / event control
│   ├── Challenges
│   ├── Submissions
│   ├── Leaderboard
│   ├── Story / investigation
│   ├── Hints
│   ├── Announcements
│   ├── Notifications
│   ├── Dashboard
│   ├── Admin
│   ├── Audit
│   └── Database
├── Development
│   ├── Setup
│   ├── Environment
│   ├── Workflow
│   └── Testing
├── Operations
│   ├── Deployment
│   ├── Monitoring
│   └── Troubleshooting
└── Security
```

## What the project is

CTF Silk Road is a Next.js 16, React 19, TypeScript, Prisma, and PostgreSQL application for a story-driven Capture The Flag event. Players authenticate, enter a protected event experience, progress through a cinematic investigation, encounter challenge gates, submit flags, earn XP, optionally spend XP on hints, and appear on a leaderboard.

The implementation is module-first: each domain module owns its server actions, services, repositories, DTOs, validations, hooks, constants, and mappers. The application uses Server Actions for most interactive domain calls and one Route Handler for protected challenge attachment downloads.

## Current project status

| Area | Status | Notes |
|---|---:|---|
| Authentication and sessions | Implemented | JWT access token plus refresh-token persistence/rotation. |
| Event lifecycle gates | Implemented | Singleton event with start/end checks and operational pause/registration controls. |
| Story/investigation progression | Implemented | Chapter, scene, dialogue, choices, evidence, unlock rules, progress, replay, and restart flows. |
| Challenge access and submissions | Implemented | Challenge access is tied to the player's current story gate and prerequisites. |
| Scoring and leaderboard | Implemented | Correct first solves update `LeaderboardEntry`; frozen player leaderboard is recomputed from solves. |
| Hints | Implemented | Sequential hint unlocks with optional XP cost. |
| Announcements and notifications | Implemented | Admin announcement CRUD/archive and per-user notifications/read state. |
| Admin operations | Implemented | Admin shell, player moderation, event pause/resume, registration toggle, audit and leaderboard views. |
| Teams | Planned / Future | Permissions mention team capabilities, but no team data model, routes, or services exist. |
| Security operations alerts/incidents | Planned / Future | Prisma models exist; no services/actions/UI are implemented in the current release. |
| Automated tests | Known gap | No dedicated test script or test suite was found in `package.json`. |

## Protected content policy

Story source documents under `docs/story/`, seeded story/challenge content under `scripts/seed-*.ts`, challenge assets under `assets/challenges/`, and character/static assets are treated as read-only game content. These docs describe systems and use placeholders such as `<FLAG_REDACTED>` instead of exposing answers.

## Entry points

- [Architecture overview](architecture/README.md)
- [Module map](modules/README.md)
- [Developer setup](development/setup.md)
- [Environment variables](development/environment.md)
- [Deployment](operations/deployment.md)
- [Security](security/README.md)
