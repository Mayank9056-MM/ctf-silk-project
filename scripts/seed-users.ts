// ============================================================================
// seed-users.ts
// ============================================================================
//
// Seeds a small, deterministic set of non-privileged dev/test player
// accounts. Never touches role: SUPER_ADMIN — that's seed-admin.ts's
// exclusive responsibility, so "who can become an admin" stays one
// auditable code path rather than something any content seed could
// accidentally grant.
// ============================================================================

import prisma from "@/lib/prisma";
import { Role, UserStatus } from "@/app/generated/prisma/enums";
import { passwordService } from "@/modules/auth/services/password.service";
import "dotenv/config"

const DEV_USERS = [
  { username: "ethan_test", email: "ethan.test@example.com", fullName: "Ethan Test" },
  { username: "robert_test", email: "robert.test@example.com", fullName: "Robert Test" },
] as const;

/**
 * Password is a fixed dev-only value, never read from an env var the
 * way seed-admin.ts's credential is — these accounts have no real
 * privilege, so there's nothing here worth protecting the way a bootstrap
 * admin credential is. Upserted by email so re-running never duplicates
 * a test account or disturbs its id.
 */
export async function seedUsers(): Promise<void> {
  const passwordHash = await passwordService.hash("dev-password-only");

  for (const user of DEV_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        passwordHash,
        role: Role.USER,
        status: UserStatus.ACTIVE,
      },
    });
  }

  console.log(`[seed-users] ${DEV_USERS.length} dev user(s) ready.`);
}

if (require.main === module) {
  seedUsers()
    .catch((error) => {
      console.error("[seed-users] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}