# Environment Configuration

Runtime configuration is validated in `config/env.ts` with Zod. Do not commit real secrets.

| Variable | Required | Purpose |
|---|---:|---|
| `NODE_ENV` | No | `development`, `production`, or `test`; defaults to `development`. |
| `APP_URL` | No | Base application URL; defaults to `http://localhost:3000`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. Use a secret manager in production. |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing/verifying access tokens; minimum 32 characters. |
| `FLAG_HASH_SECRET` | Yes | Secret used for flag hashing/comparison; minimum 32 characters. |
| `RATE_LIMIT_HASH_SECRET` | Yes | Secret used to hash rate-limit identifiers; minimum 32 characters. |
| `ARGON2_MEMORY_COST` | No | Argon2 memory cost, default `65536`, min `65536`, max 1 GiB. |
| `ARGON2_TIME_COST` | No | Argon2 time cost, default `3`, range 1-10. |
| `ARGON2_PARALLELISM` | No | Argon2 parallelism, default `1`, range 1-32. |

## Secret handling

Use placeholders in examples:

```dotenv
DATABASE_URL=postgresql://<USER>:<PASSWORD>@<HOST>:5432/<DATABASE>
JWT_ACCESS_SECRET=<SECRET_AT_LEAST_32_CHARS>
FLAG_HASH_SECRET=<SECRET_AT_LEAST_32_CHARS>
RATE_LIMIT_HASH_SECRET=<SECRET_AT_LEAST_32_CHARS>
```

Never include real flags, token secrets, passwords, or production URLs in documentation.
