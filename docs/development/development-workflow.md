# Development Workflow

## Principles

- Treat `docs/story/`, challenge seed data, evidence text, flags, clues, and game assets as protected content.
- Keep Server Actions thin: authenticate, authorize, validate, delegate.
- Put business rules in services and Prisma query shapes in repositories.
- Return DTOs from mappers; do not return raw Prisma records to clients when sensitive fields exist.
- Add migrations for schema changes; do not manually mutate production schema.

## Common workflow

```bash
npm install
docker compose up -d postgres
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

Before committing:

```bash
npm run lint
npm run build
```

No automated test command currently exists. If tests are added, wire them into `package.json`.
