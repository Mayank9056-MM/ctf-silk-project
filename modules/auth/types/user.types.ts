import { User } from "@/app/generated/prisma/client";

/**
 * Client-safe user shape — excludes passwordHash and the two brute-force
 * fields (failedLoginAttempts/lockedUntil), which are operational
 * security state with no reason to ever leave the server. Every action
 * that returns a user must return this type, never the raw Prisma User.
 */
export type PublicUser = Omit<
  User,
  "passwordHash" | "failedLoginAttempts" | "lockedUntil"
>;
