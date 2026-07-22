"use server";

import { redirect } from "next/navigation";

import { authService } from "@/modules/auth/services/auth.service";

/**
 * Server Action for logging out the current session.
 *
 * Unlike loginAction/registerAction, this takes no form input and needs no
 * useActionState wiring — it's meant to be wired directly to a form's
 * `action` prop (or invoked from a client component via a thin wrapper),
 * e.g. `<form action={logoutAction}><button type="submit">Log out</button></form>`.
 *
 * authService.logout() is best-effort by design: it revokes the refresh
 * token if one exists, but a user is considered logged out client-side the
 * moment their cookies are cleared, regardless of whether the DB write
 * succeeded. So unexpected errors are logged but never surfaced to the
 * user — logout should never appear to "fail" from their perspective.
 */
export async function logoutAction(): Promise<void> {
  try {
    await authService.logout();
  } catch (error) {
    console.error("[logoutAction] unexpected error:", error);
  }

  // redirect() throws internally by design — it must stay outside the try
  // block above, or Next's own control-flow exception gets swallowed by our
  // catch and treated as an application error.
  redirect("/login");
}