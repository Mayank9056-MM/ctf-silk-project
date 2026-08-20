# Security Documentation

## Authentication

The app uses password-based authentication. Passwords are hashed with Argon2id. Access tokens are JWTs stored in cookies. Refresh tokens are stored as hashes and can be revoked/rotated. Login includes brute-force protection fields and dummy verification for unknown users.

## Authorization

Authorization is permission-based. `USER` receives player capabilities; `SUPER_ADMIN` receives those plus management, settings, and audit capabilities. Use `requirePermission()` for most protected operations.

## Game security

Client-side validation must never be considered authoritative. Players can manipulate URLs, JavaScript state, forms, and network requests. Critical decisions are enforced server-side: event access, current story gate, challenge prerequisites, hint visibility, attachment access, flag validation, score writes, and admin permissions.

## Submission security

- Flags are compared against server-side hashes; actual flags must never be exposed.
- Duplicate correct submissions cannot award duplicate XP because `ChallengeSolve(userId, challengeId)` is unique.
- Submission actions are rate-limited globally and per user.
- Inaccessible challenge submissions return generic errors.
- Incorrect attempts are persisted for auditability/game review without exposing answer material.

## Secrets

Secrets are runtime environment variables: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `FLAG_HASH_SECRET`, and `RATE_LIMIT_HASH_SECRET`. Do not commit real values. Documentation must use `<SECRET>` or `[REDACTED]` placeholders.

## Sensitive data that must not reach clients

- `passwordHash`
- refresh token hashes/raw tokens
- `flagHash` and raw flags
- unreleased story/evidence content
- internal challenge access denial reasons
- admin-only user emails outside admin views
- temporary reset passwords except one-time admin display

## Threat model

| Threat | Current mitigation | Gaps / follow-up |
|---|---|---|
| Malicious player bypasses story gate | Server reads `StoryProgress.currentSceneId` and validates current `CHALLENGE_GATE`. | Add tests for direct action/API calls. |
| Flag brute force | Format validation and database-backed rate limits. | Add anomaly detection/alerts. |
| Duplicate solve / score inflation | DB composite key plus transactional leaderboard upsert. | Add concurrency tests. |
| Attachment enumeration | Auth + challenge access + challenge-scoped attachment lookup + generic 404. | Monitor repeated misses. |
| Privilege escalation | Permission helpers and admin-only services. | Add admin authorization tests. |
| Token theft/reuse | HttpOnly cookies and hashed refresh tokens with reuse handling. | Add MFA/session inventory. |
| Data leakage in logs/docs | Redaction utilities and docs policy. | Audit all log metadata before production. |
| Frozen leaderboard manipulation | Freeze timestamp stored server-side; player reads aggregate by cutoff. | Snapshot if event scale grows. |

## Security operations status

Prisma contains planned security signal, alert, incident, and incident timeline models. No implemented services/actions/UI were found, so these are future capabilities, not current operational controls.
