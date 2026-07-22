// modules/auth/authorization/permissions.ts

import { Role } from "@/app/generated/prisma/enums";

/**
 * The full set of fine-grained capabilities in the system. Server Actions,
 * Server Components, and API Routes should check against these — never
 * against `role` directly. Roles are an implementation detail of *which
 * permissions a user has*, not something the rest of the app should reason
 * about.
 */
export enum Permission {
  VIEW_PROFILE = "VIEW_PROFILE",
  UPDATE_PROFILE = "UPDATE_PROFILE",

  CREATE_TEAM = "CREATE_TEAM",
  JOIN_TEAM = "JOIN_TEAM",
  LEAVE_TEAM = "LEAVE_TEAM",

  VIEW_CHALLENGES = "VIEW_CHALLENGES",
  SUBMIT_FLAG = "SUBMIT_FLAG",

  VIEW_LEADERBOARD = "VIEW_LEADERBOARD",

  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_EVENTS = "MANAGE_EVENTS",
  MANAGE_CHALLENGES = "MANAGE_CHALLENGES",
  MANAGE_ANNOUNCEMENTS = "MANAGE_ANNOUNCEMENTS",

  SYSTEM_SETTINGS = "SYSTEM_SETTINGS",
}

const USER_PERMISSIONS: readonly Permission[] = [
  Permission.VIEW_PROFILE,
  Permission.UPDATE_PROFILE,
  Permission.CREATE_TEAM,
  Permission.JOIN_TEAM,
  Permission.LEAVE_TEAM,
  Permission.VIEW_CHALLENGES,
  Permission.SUBMIT_FLAG,
  Permission.VIEW_LEADERBOARD,
];

const SUPER_ADMIN_PERMISSIONS: readonly Permission[] = [
  ...USER_PERMISSIONS,
  Permission.MANAGE_USERS,
  Permission.MANAGE_EVENTS,
  Permission.MANAGE_CHALLENGES,
  Permission.MANAGE_ANNOUNCEMENTS,
  Permission.SYSTEM_SETTINGS,
];

/**
 * Role → Permission map. Only two tiers today (USER, SUPER_ADMIN), but the
 * shape stays a Record over the full Role enum — if you introduce an
 * intermediate ADMIN role later (e.g. can manage challenges but not touch
 * SYSTEM_SETTINGS or MANAGE_USERS), it's a new entry here and nowhere else.
 * Nothing outside this file encodes how many roles exist.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, ReadonlySet<Permission>>> =
  {
    [Role.USER]: new Set(USER_PERMISSIONS),
    [Role.SUPER_ADMIN]: new Set(SUPER_ADMIN_PERMISSIONS),
  };
