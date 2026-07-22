// app/(protected)/layout.tsx

import { requireAuth } from "@/modules/auth/authorization/require-auth";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/providers/auth-provider";

/**
 * Guards every route under (protected): /dashboard, /team, /leaderboard,
 * etc. This is a second, defense-in-depth check — proxy.ts already blocks
 * unauthenticated requests from reaching these routes at all — but relying
 * solely on proxy.ts means a bug in its matcher/route list silently opens
 * a route with no fallback. Layouts fail closed independently of proxy.ts.
 *
 * Deliberately calls requireAuth(), not requirePermission(). Every
 * authenticated user (USER or SUPER_ADMIN) should be able to reach
 * /dashboard, /team, /leaderboard — this layout only answers "is anyone
 * signed in," not "can they do X here." Page- or action-level checks
 * inside these routes handle anything finer-grained.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    // requireAuth() throws ApiError for both "no token" and "invalid/
    // expired token" — either way, the correct UX here is the same
    // redirect, not a rendered error state.
    redirect("/login");
  }

  return <AuthProvider user={user}>{children}</AuthProvider>;
}
