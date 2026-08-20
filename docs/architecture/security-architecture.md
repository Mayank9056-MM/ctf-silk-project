# Security Architecture

Security is enforced primarily on the server boundary and inside domain services. Client-side checks are UX only and must never be treated as authoritative.

## Authentication

- Access tokens are JWTs stored in cookies.
- Refresh tokens are persisted as hashes in PostgreSQL and rotated by the auth service.
- Passwords are hashed with Argon2id through configurable cost parameters.
- Unknown-user login attempts run dummy password verification to reduce timing side channels.
- The Next.js 16 `proxy.ts` gate redirects unauthenticated users away from protected player routes.

## Authorization

Authorization is permission-based. Roles map to `Permission` values in `modules/auth/authorization/permission.ts`; most code should call `requirePermission()` instead of checking roles directly. `SUPER_ADMIN` currently inherits user permissions and gains management/audit permissions.

## Game integrity

- Challenge GET, hint access, attachment download, and flag submission re-derive challenge authorization server-side.
- Challenge access failures are collapsed to generic not-found behavior to reduce enumeration.
- Flag hashes are stored server-side; docs and DTOs must never expose raw flags or answers.
- Correct-solve uniqueness is enforced by the database, not only by prior reads.

## Data protection

Repositories and mappers omit sensitive fields where possible. Logs and audit metadata should pass through redaction utilities before persistence or output.

For the full threat model, see [Security](../security/README.md).
