# Local Setup

## Prerequisites

- Node.js compatible with Next.js 16 and React 19.
- npm, using the committed `package-lock.json`.
- Docker and Docker Compose for local PostgreSQL/pgAdmin.
- A `.env` file containing the variables documented in [Environment](environment.md).

## Install

```bash
npm install
```

## Start local database

```bash
docker compose up -d postgres
```

Optional pgAdmin:

```bash
docker compose up -d pgadmin
```

## Database setup

The repository includes Prisma migrations and seed scripts. Typical local flow:

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

For destructive local reset:

```bash
npm run db:reset
npm run seed
```

## Start development server

```bash
npm run dev
```

## Build

```bash
npm run build
```

The build script runs `prisma generate` before `next build`.
