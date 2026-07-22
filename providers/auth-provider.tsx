// providers/auth-provider.tsx

"use client";

import { createContext, useContext, useMemo } from "react";

import type { AuthenticatedUser } from "@/modules/auth/authorization/require-auth";
import { Permission } from "@/modules/auth/authorization/permission";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "@/modules/auth/authorization/has-pesmission";

interface AuthContextValue {
  /** The verified identity resolved server-side by requireAuth/requirePermission. */
  user: AuthenticatedUser;
  /** Bound convenience wrappers around has-permission.ts, scoped to the current user's role. */
  can: (permission: Permission) => boolean;
  canAny: (permissions: readonly Permission[]) => boolean;
  canAll: (permissions: readonly Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  user: AuthenticatedUser;
  children: React.ReactNode;
}

/**
 * Client-side identity context. The (protected) and admin layouts each
 * resolve `user` server-side via requireAuth()/requirePermission() and
 * pass it in as a prop — this component's only job is to make that
 * already-verified identity available to Client Components below it
 * without re-fetching or re-verifying anything.
 *
 * Deliberately carries ONLY `{ userId, role }` — the same shape
 * AuthenticatedUser has everywhere else. Two things this is NOT:
 *
 *   1. Not a token store. The JWT itself never crosses into this context
 *      or into any Client Component — it stays server-side in an
 *      httpOnly cookie, invisible to JS. Putting a raw or decoded token
 *      in React state would hand an XSS payload a usable session.
 *
 *   2. Not a profile store. No username, email, avatar, or team here.
 *      requireAuth() intentionally never hits the DB (see its own
 *      comments), so this context can't have profile data without a
 *      layout adding an explicit DB read. If a page needs "Hi, {username}"
 *      in the nav, that's a deliberate, visible query — e.g. a small
 *      getCurrentUserProfile() call cached with the rest of your data
 *      layer — not something silently bolted onto every protected route
 *      through this provider.
 *
 * `can`/`canAny`/`canAll` exist so Client Components (e.g. "hide this
 * button for non-admins") call useAuth().can(Permission.MANAGE_USERS)
 * instead of importing hasPermission and threading user.role through
 * props everywhere. This is UI-only — hiding a button is not
 * enforcement. The Server Action behind that button still calls
 * requirePermission() independently; a user with dev tools open can
 * always make the request directly, so the real check must live
 * server-side regardless of what this context renders.
 */
export function AuthProvider({ user, children }: AuthProviderProps) {
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      can: (permission) => hasPermission(user.role, permission),
      canAny: (permissions) => hasAnyPermission(user.role, permissions),
      canAll: (permissions) => hasAllPermissions(user.role, permissions),
    }),
    // user.role/user.userId, not `user` itself, are the real dependency —
    // but AuthenticatedUser is a small, server-constructed plain object
    // recreated fresh per request, so referential equality already tracks
    // value equality here. Memoizing on `user` avoids handing consumers a
    // new `can`/`canAny`/`canAll` identity on every render, which matters
    // if any of them end up in a useEffect dependency array downstream.
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Throws rather than returning null/undefined on misuse. A component that
 * silently receives `undefined` for `user` and renders `undefined.userId`
 * fails confusingly, deep in the render tree, possibly only in
 * production. Failing loudly at the hook call site — "you're outside an
 * AuthProvider" — turns a runtime crash into an obvious, fixable mistake
 * during development.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth() was called outside an AuthProvider. This component must " +
        "render under app/(protected)/layout.tsx or app/admin/layout.tsx.",
    );
  }

  return context;
}