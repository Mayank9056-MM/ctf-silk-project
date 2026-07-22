// modules/auth/authorization/require-role.ts

import { Role } from "@/app/generated/prisma/enums";
import { requireAuth, AuthenticatedUser } from "./require-auth";
import { Permission } from "./permission";
import { hasAllPermissions, hasAnyPermission } from "./has-pesmission";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";

/**
 * Requires authentication AND that the user's role is one of `allowedRoles`.
 * Use this for the rare cases where the check is genuinely about role
 * identity rather than capability — e.g. an admin-only audit log view that
 * every admin should see regardless of which specific permissions they
 * hold. Most checks should prefer requirePermission below.
 */
export async function requireRole(
  allowedRoles: readonly Role[],
): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw ApiError.forbidden(
      ErrorCode.FORBIDDEN,
      "You do not have permission to perform this action.",
    );
  }

  return user;
}

interface RequirePermissionOptions {
  /**
   * "all" (default) requires every listed permission; "any" requires at
   * least one. Most call sites pass a single permission, where this is
   * moot — it only matters for multi-permission checks.
   */
  match?: "all" | "any";
}

/**
 * Requires authentication AND that the user's role grants the given
 * permission(s). This is the primary authorization entry point for the
 * rest of the app — Server Actions and protected Server Components should
 * reach for this, not requireRole, so that a permission's mapping to
 * roles stays defined in exactly one place (permissions.ts).
 */
export async function requirePermission(
  permission: Permission | readonly Permission[],
  options: RequirePermissionOptions = {},
): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  const permissions = Array.isArray(permission) ? permission : [permission];
  const match = options.match ?? "all";

  const authorized =
    match === "all"
      ? hasAllPermissions(user.role, permissions)
      : hasAnyPermission(user.role, permissions);

  if (!authorized) {
    throw ApiError.forbidden(
      ErrorCode.FORBIDDEN,
      "You do not have permission to perform this action.",
    );
  }

  return user;
}