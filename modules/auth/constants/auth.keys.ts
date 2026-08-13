/**
 * Single query family: the current session. No parameters — there is
 * exactly one authenticated identity per browser, resolved
 * server-side — matching dashboardKeys' "one root, one leaf"
 * minimalism for a resource with no natural sub-collections.
 */
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
} as const;