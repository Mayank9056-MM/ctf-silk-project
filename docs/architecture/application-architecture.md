# Application Architecture

## Frontend

The frontend uses Next.js App Router routes under `app/` and React components under `components/`. Protected player routes live under `app/(protected)`, authentication routes under `app/(auth)`, and admin routes under `app/admin`. Providers configure authentication/session recovery, TanStack Query, and portal container behavior.

## Backend

The backend is embedded in the Next.js application. Domain write/read operations are generally exposed as Server Actions. These actions are deliberately thin: authenticate, authorize, validate, call a service, and return an `ActionState` or DTO. The route handler at `app/api/challenges/[challengeId]/attachments/[attachmentId]/route.ts` is used where an HTTP response with binary file data is required.

## Domain module layout

Most modules follow this pattern:

```text
modules/<module>/
├── actions/        # Server Action entry points
├── constants/      # query keys, limits, fixed values
├── hooks/          # TanStack Query / mutation hooks
├── repositories/   # Prisma query/write logic
├── services/       # business rules and orchestration
├── types/          # DTOs and internal types
├── utils/          # mappers, access helpers, pure functions
└── validations/    # Zod schemas
```

Not every module has every folder. For example, `event` currently exposes services/repositories/types/utils but no direct Server Actions.

## Server/client contract

DTO mappers are important security boundaries. Sensitive database fields such as password hashes, refresh token hashes, flag hashes, and internal denial reasons should not be returned to client components. Server Actions should return stable result shapes and avoid leaking authorization details.

## Infrastructure

Local infrastructure is PostgreSQL and pgAdmin from `docker-compose.yml`. There is no committed production CI/CD or hosting manifest. Deployment documentation separates the current repository-supported deployment path from recommended production hardening.
