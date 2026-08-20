# Development

Use these documents for local development:

- [Setup](setup.md)
- [Environment](environment.md)
- [Development workflow](development-workflow.md)
- [Testing](testing.md)

## Actual scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js development server. |
| `npm run build` | Generate Prisma client and build Next.js. |
| `npm run start` | Start built Next.js application. |
| `npm run lint` | Run ESLint. |
| `npm run db:reset` | Reset local database through `scripts/reset-db.ts`. |
| `npm run seed` | Run aggregate seed script. |
| `npm run seed:event` | Seed singleton event/control. |
| `npm run seed:chapters` | Seed chapters. |
| `npm run seed:story` | Seed story content. |
| `npm run seed:challenges` | Seed challenges. |
| `npm run seed:users` | Seed users. |
| `npm run seed:admin` | Seed admin account. |

No `test` script is currently defined.
