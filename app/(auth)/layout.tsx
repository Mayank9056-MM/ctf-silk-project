// app/(auth)/layout.tsx

import { redirect } from "next/navigation";
import { requireAuth } from "@/modules/auth/authorization/require-auth";

/**
 * Guards /login and /register. The one rule here: a signed-in user should
 * never see these pages — send them to /dashboard instead. This mirrors
 * proxy.ts's guest-route handling, but as with the protected layout, it's
 * a deliberate second layer rather than trusting proxy.ts alone.
 *
 * Note the inverted try/catch vs. the protected layout: here, requireAuth()
 * *succeeding* is the redirect condition, and failing (no/invalid token)
 * is the expected, pass-through case — an unauthenticated visitor is
 * exactly who login/register are for.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAuth();
  } catch {
    // Not authenticated — this is the expected visitor for /login and
    // /register. Let them through.
    return <>{children}</>;
  }

  // A valid session already exists; login/register have nothing to offer.
  redirect("/dashboard");
}