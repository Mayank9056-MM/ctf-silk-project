// app/admin/layout.tsx

import { redirect } from "next/navigation";

import { requirePermission } from "@/modules/auth/authorization/require-role";
import { Permission } from "@/modules/auth/authorization/permission";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import { AuthProvider } from "@/providers/auth-provider";

/**
 * Guards everything under /admin. Two failure modes, two different
 * destinations:
 *   - not signed in at all → send to /login (same as the protected layout)
 *   - signed in, but not SUPER_ADMIN → send to /dashboard, not /login;
 *     re-prompting a legitimately signed-in USER for credentials they
 *     already provided is confusing UX and won't change the outcome.
 *
 * Uses requirePermission rather than a role check for the reason covered
 * earlier: this layout shouldn't need to know "SUPER_ADMIN" is the role
 * that manages the event. It should ask for the *capability* — here,
 * MANAGE_EVENTS stands in as "can operate the admin area at all." If a
 * future ADMIN tier is introduced with a narrower set of admin
 * permissions, this line doesn't change; only permissions.ts does.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requirePermission(Permission.MANAGE_EVENTS);
  } catch (error) {
    if (error instanceof ApiError && error.code === ErrorCode.FORBIDDEN) {
      redirect("/dashboard");
    }
    // Anything else (UNAUTHORIZED, INVALID_ACCESS_TOKEN) means there's no
    // valid session at all.
    redirect("/login");
  }

  return <AuthProvider user={user}>{children}</AuthProvider>;
}