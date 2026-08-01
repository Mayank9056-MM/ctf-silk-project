# The Silk Road Investigation

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=111)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-required-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

> A story-driven cybersecurity Capture The Flag platform for live collegiate events, combining cinematic investigation, OSINT, digital forensics, unlockable narrative progression, scoring, auditability, and administrative controls.

## Overview

**The Silk Road Investigation** is not a generic CRUD application. It is a production-oriented event platform where players act as FBI cyber investigators, progress through a narrative case file, solve cybersecurity challenges, collect evidence, and compete on a leaderboard during a live event.

The application is built around strict separation of concerns:

```mermaid
flowchart TD
    UI[Next.js App Router UI]
    Action[Server Actions]
    Service[Service Layer]
    Repository[Repository Layer]
    Prisma[Prisma Client]
    Postgres[(PostgreSQL)]

    UI --> Action
    Action --> Service
    Service --> Repository
    Repository --> Prisma
    Prisma --> Postgres
```

This design keeps request handling, domain rules, persistence, DTO mapping, and validation independently testable and easier to reason about under live-event pressure.

## Vision

The platform aims to provide a professional investigation experience for approximately 2,000+ participants:

- Players should feel like investigators, not form-fillers.
- Challenge progression should reinforce the story, not interrupt it.
- Scoring should be fair, auditable, and resilient to duplicate submissions.
- Admins should be able to manage live-event state without compromising competitive integrity.
- Logs, audit records, and metrics should support post-event review and incident response.

## Features

### Story Mode

- Chapter, scene, dialogue, choice, and evidence concepts.
- Story progress tracking per user.
- Branch-aware scene progression.
- Replay support for completed scenes.
- Unlock rules for chapters, scenes, and evidence.
- Narrative documentation for characters, evidence, organizations, worldbuilding, and timeline.

### Cybersecurity Challenges

- Challenge metadata, difficulty, XP, chapters, display ordering, and attachments.
- Challenge prerequisites through a many-to-many relation.
- Server-side flag verification with hashed flags.
- Submission history and solve records.
- Challenge seed scripts with stable slugs.

### Competition Systems

- Event lifecycle gates for gameplay access.
- Live and frozen leaderboard modes.
- Per-user ranks and admin leaderboard views.
- Rate limiting for login, registration, refresh, and flag submission pressure points.

### Platform Capabilities

- JWT access tokens and refresh-token rotation.
- Argon2id password hashing.
- Role-to-permission authorization model.
- Structured logging with redaction.
- Audit-log schema for administrative and security events.
- Zod environment and request validation.

## Architecture Overview

The repository follows a module-first architecture. Each domain module owns its service, repository, DTOs, validations, hooks, constants, actions, and utilities.

```mermaid
flowchart LR
    Auth[Auth Module]
    Event[Event Module]
    Story[Story Module]
    Challenge[Challenge Module]
    Submission[Submission Module]
    Leaderboard[Leaderboard Module]
    Audit[Audit Module]

    Auth --> Submission
    Event --> Story
    Event --> Submission
    Event --> Leaderboard
    Challenge --> Submission
    Submission --> Leaderboard
    Story --> Challenge
    Audit -. planned/audit trail .-> Auth
    Audit -. planned/audit trail .-> Challenge
    Audit -. planned/audit trail .-> Leaderboard
```

### Request Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Action as Server Action
    participant Service
    participant Repository
    participant DB as PostgreSQL

    Browser->>Action: Submit form / invoke mutation
    Action->>Action: Authenticate + validate input
    Action->>Service: Call domain use case
    Service->>Repository: Query/write persistence
    Repository->>DB: Prisma operation
    DB-->>Repository: Result
    Repository-->>Service: Domain record
    Service-->>Action: DTO / outcome
    Action-->>Browser: ActionState / query result
```

## Folder Structure

```text
.
├── app/                      # Next.js App Router routes, layouts, global errors
├── components/               # Shared UI and auth/system shell components
├── config/                   # Runtime environment validation
├── docs/story/               # Narrative and game-design source documents
├── lib/                      # Shared infrastructure: Prisma, logger, errors, rate limit
├── modules/                  # Domain modules
│   ├── audit/                # Audit enums, categories, DTOs/constants
│   ├── auth/                 # Authentication, authorization, users, tokens
│   ├── challenge/            # Challenge reads, flag verification, metadata
│   ├── event/                # Event singleton and access state
│   ├── leaderboard/          # Rankings, freeze/unfreeze, rank DTOs
│   ├── story/                # Story engine, scenes, evidence, unlocks
│   └── submission/           # Flag attempts and solve records
├── prisma/                   # Prisma schema and migrations
├── scripts/                  # Seed scripts for event, challenges, and story
└── public/                   # Static assets
```

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js App Router | Server Components, Server Actions, routing |
| Language | TypeScript | Type safety across domain boundaries |
| UI | React 19, Tailwind CSS, shadcn/base-ui patterns | Interactive player/admin interfaces |
| Data Access | Prisma 7 | Typed PostgreSQL access |
| Database | PostgreSQL | Durable event, user, story, and scoring state |
| Validation | Zod | Input and environment validation |
| Auth | JWT, refresh tokens, Argon2id | Stateless access tokens, secure password hashing |
| Data Fetching | TanStack Query | Client-side server-action orchestration and caching |
| Observability | Structured console logger | Redacted module-scoped logs |

## System Design

### Core Data Model

```mermaid
erDiagram
    User ||--o{ RefreshToken : owns
    User ||--o{ Submission : submits
    User ||--o{ ChallengeSolve : solves
    User ||--o| StoryProgress : has
    User ||--o{ SceneCompletion : completes
    User ||--o{ ChoiceSelection : selects
    User ||--o{ AuditLog : produces

    Event ||--|| Event : singleton
    Chapter ||--o{ Scene : contains
    Chapter ||--o{ Challenge : groups
    Challenge ||--o{ ChallengeAttachment : has
    Challenge ||--o{ Submission : receives
    Challenge ||--o{ ChallengeSolve : records
    Challenge ||--o{ ChallengePrerequisite : requires
    Scene ||--o{ DialogueLine : has
    Scene ||--o{ Choice : branches
    Scene ||--o{ UnlockRule : gated_by
    Evidence ||--o{ UnlockRule : gated_by
```

### Architectural Decisions

- **Server Actions as application boundary**: Actions handle authentication, authorization, validation, and `ActionState` responses.
- **Services own business rules**: Event gating, duplicate solve semantics, scene progression, leaderboard freeze logic, and auth state changes live in services.
- **Repositories own persistence**: Prisma details are isolated so services read like domain use cases.
- **DTOs protect client contracts**: DTOs avoid leaking sensitive database fields such as password hashes, token hashes, flag hashes, and branch destinations.
- **Zod at boundaries**: Form inputs, action payloads, and environment variables are validated before domain logic executes.

## Project Modules

### Authentication

The auth module handles registration, login, logout, refresh-token rotation, access-token issuance, role-to-permission authorization, brute-force lockout, and password hashing.

Key behaviors:

- Argon2id password hashing with configurable parameters.
- Dummy password verification for unknown users to reduce timing side channels.
- Refresh token hashing before storage.
- HttpOnly auth cookies.
- Permission checks are capability-based rather than role checks scattered through the codebase.

### Story Engine

The story module manages player progress through published chapters and scenes. It composes scene DTOs with dialogue, choices, challenge gates, evidence previews, and progress state.

Core concepts:

- `StoryProgress` tracks the player's current chapter and scene.
- `SceneCompletion` records completed scenes.
- `ChoiceSelection` records player decisions.
- `UnlockRule` gates chapters, scenes, or evidence based on story/challenge state.
- Scene transitions are resolved centrally so clients cannot jump arbitrarily.

### Challenge Engine

The challenge module owns challenge metadata, challenge prerequisites, attachments, flag hashes, and public challenge DTOs. Challenges are organized by chapter and display order.

### Submission Engine

The submission module records every flag attempt and creates a solve only for the first correct answer per user/challenge pair. Duplicate correct submissions are logged as attempts but do not award XP again.

### Leaderboard

The leaderboard module provides paginated live standings, frozen standings, user rank lookup, and admin-only live views. Freezing uses the event's `leaderboardFrozenAt` timestamp so player views can stop changing while admins retain live visibility.

### Audit System

The Prisma schema includes a structured audit-log table with actor, action, resource, request context, before/after payloads, metadata, success state, and indexes for common filters. Audit event/category constants are prepared for compliance-grade event classification.

### Logger

The logger is module-scoped and emits structured entries. It performs deep redaction of sensitive keys and masks email addresses before serialization.

### Metrics

The current repository has domain data that can power metrics, such as submissions, solves, story progress, leaderboard rows, and audit events. A dedicated metrics module is not yet implemented and should be added before production operation.

### Caching

TanStack Query provides short-lived client-side caching for player data. Story-specific cache utilities exist, but operational caching remains intentionally minimal. Event freeze state and leaderboard reads are resolved fresh to preserve live-event correctness.

## Database and Prisma

### Prisma Commands

```bash
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npx prisma studio
```

The generated Prisma client is configured to output under `app/generated/prisma`.

### Database Setup

1. Create a PostgreSQL database.
2. Set `DATABASE_URL` in `.env`.
3. Run migrations.
4. Seed event and content data.

```bash
npm install
npx prisma migrate deploy
npm run seed:event
npm run seed:challenges
npm run seed:story
```

## Repository Pattern

Repositories accept a `DbClient`, allowing the same code to run against the normal Prisma client or a transaction client. This supports atomic writes such as login state changes and submission/solve recording.

## DTO Pattern

DTOs define exactly what leaves the server boundary. This is especially important for:

- Flags and flag hashes.
- Refresh token hashes.
- Password hashes.
- Admin-only story graph destinations.
- Submission history.
- Leaderboard rows.

## Validation

Validation happens with Zod in three places:

- Environment variables in `config/env.ts`.
- Server Action inputs.
- Seed-script challenge data before database writes.

## Error Handling

The project uses `ApiError` and `ErrorCode` to represent expected domain failures. Server Actions translate these into user-safe `ActionState` values, while unexpected errors are logged and converted to generic failure messages.

## Security Features

- Argon2id password hashing.
- JWT access-token verification.
- Refresh-token hashing and rotation.
- HttpOnly cookies.
- Account lockout after failed logins.
- Rate limits for high-risk actions.
- Server-side permission enforcement.
- Hashed flags and normalized flag input.
- Logger redaction for secrets, hashes, tokens, and passwords.
- Audit schema for sensitive actions.

## Performance Optimizations

- Prisma indexes for audit filtering, rate-limit expiry, token lookup, challenge prerequisites, and attachments.
- Short-lived TanStack Query cache windows to reduce repeated client fetches.
- Transaction bodies avoid CPU-heavy work where possible.
- Fixed-window rate limit uses atomic SQL upsert.
- Leaderboard freeze avoids storing a copied snapshot by using solve timestamps relative to the freeze time.

## Environment Variables

Create `.env` from the following template:

```env
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/ctf_silk_project
JWT_ACCESS_SECRET=replace-with-at-least-32-characters
FLAG_HASH_SECRET=replace-with-at-least-32-characters
RATE_LIMIT_HASH_SECRET=replace-with-at-least-32-characters
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=1
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open <http://localhost:3000>.

## Running the Project

```bash
npm run build
npm run start
```

## Seed Scripts

| Command | Purpose |
|---|---|
| `npm run seed:event` | Initializes the singleton event record. |
| `npm run seed:challenges` | Upserts challenge content and prerequisites. |
| `npm run seed:story` | Upserts the initial narrative slice, evidence, and story-linked challenges. |

## Story Documentation

Narrative and challenge-design source material lives in `docs/story/`:

- `STORY.md` — high-level plot and progression.
- `CHARACTERS.md` — character canon and gameplay implications.
- `CHALLENGES.md` — challenge design framework.
- `EVIDENCE.md` — evidence catalog and chain-of-custody guidelines.
- `ORGANIZATIONS.md` — institutional and adversary references.
- `TIMELINE.md` — chronological event reference.
- `WORLD.md` — setting and worldbuilding rules.

## Testing

Current package scripts include linting but do not yet define unit, integration, or end-to-end test commands.

Recommended test roadmap:

- Unit tests for services and utility functions.
- Repository tests against disposable PostgreSQL.
- Server Action tests for validation and authorization behavior.
- Race-condition tests for duplicate solves and story advancement.
- E2E tests for registration, login, challenge solve, story unlock, and leaderboard freeze flows.

Run the available check:

```bash
npm run lint
```

## Deployment

Production deployment requires:

1. PostgreSQL database with migrations applied.
2. Secure secrets for JWT, flag hashing, and rate-limit hashing.
3. HTTPS so secure cookies are enforced.
4. Runtime environment set to `production`.
5. Seeded event configuration and published content.
6. Log capture and retention configured by the hosting platform.

```bash
npm ci
npx prisma migrate deploy
npm run build
npm run start
```

## Monitoring

Minimum recommended live-event dashboards:

- Registration rate and active sessions.
- Login failures and account lockouts.
- Global and per-user flag submission rates.
- Submission correctness ratio by challenge.
- Solve velocity over time.
- Story progress distribution by chapter/scene.
- Leaderboard query latency.
- Database connection utilization.
- Server Action error rate.
- Audit-event volume by action/category.

## Future Roadmap

- Admin CMS for chapters, scenes, choices, evidence, challenges, and attachments.
- Dedicated metrics module with counters, timers, and event dashboards.
- Request ID propagation through logs, audit records, and responses.
- Team support if the event changes from individual to team competition.
- Email verification and password reset flows.
- Export tools for leaderboard, submissions, and audit reports.
- Anti-cheat anomaly detection for flag sharing and suspicious solve timing.
- Story graph validation tooling for cycles, orphan scenes, and dangling choices.
- Object storage integration for challenge attachments.
- Production readiness runbooks and incident-response playbooks.

## Contributing Guidelines

1. Read `AGENTS.md` before editing code.
2. Read the relevant Next.js docs under `node_modules/next/dist/docs/` before changing App Router behavior.
3. Preserve the module architecture: Action → Service → Repository → Prisma.
4. Keep business rules in services, not components or repositories.
5. Validate untrusted input with Zod.
6. Return DTOs, not raw Prisma records, across UI boundaries.
7. Do not log secrets, flags, hashes, tokens, or passwords.
8. Add migrations for schema changes.
9. Add or update seed scripts for canonical content changes.
10. Update story docs when narrative facts change.

## Coding Standards

- TypeScript-first; avoid `any` unless a boundary requires it.
- Use capability permissions, not ad-hoc role checks.
- Prefer transactions for multi-write invariants.
- Keep CPU-heavy operations outside transactions when possible.
- Use stable slugs for seeded content.
- Never store plaintext flags or refresh tokens.
- Avoid try/catch around imports.
- Keep comments focused on non-obvious domain decisions.

## License

No license has been declared yet. Add a `LICENSE` file before distributing this repository outside the event team.

## Acknowledgements

Built for a story-driven cybersecurity event experience, drawing on investigative fiction, OSINT practice, digital forensics workflows, and live CTF operations.
