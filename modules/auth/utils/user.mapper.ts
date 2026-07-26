import type { User } from "@/app/generated/prisma/client";
import type { PublicUser } from "../types/user.types";

/**
 * The one place allowed to read passwordHash/failedLoginAttempts/
 * lockedUntil (implicitly, via the full User type) and choose not to
 * forward them. AuthService returns the result of this, never a raw
 * repository result — same discipline as challenge.mapper.ts and
 * submission.mapper.ts.
 */
export function toPublicUser(user: User): PublicUser {
  const { passwordHash, failedLoginAttempts, lockedUntil, ...publicUser } =
    user;
  return publicUser;
}

export function toPublicUserList(users: User[]): PublicUser[] {
  return users.map(toPublicUser);
}
