// modules/auth/authorization/has-permission.ts

import { Role } from "@/app/generated/prisma/enums";
import { Permission, ROLE_PERMISSIONS } from "./permission";

/**
 * Pure, side-effect-free permission checks. No cookies, no JWT, no DB, no
 * throwing — just role in, boolean out. This is what makes them safe to
 * call from anywhere: Server Components, Client Components (for
 * conditionally rendering UI, e.g. "hide the Manage Users link"), Server
 * Actions, tests. Anything that needs to *enforce* a permission (throw on
 * failure) belongs in require-role.ts, which is built on top of these.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function hasAnyPermission(
  role: Role,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(
  role: Role,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}