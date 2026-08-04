// ============================================================================
// seed-admin.ts
// ============================================================================
//
// Seeds exactly one bootstrap SUPER_ADMIN account. Credentials come from
// environment variables, never a literal in this file — unlike
// seed-users.ts's dev accounts, this row's password is a genuine
// production credential the moment this script runs against a real
// deployment, and hardcoding one here would mean it ships in source
// control.
// ============================================================================

import prisma from "@/lib/prisma";
import { Role, UserStatus } from "@/app/generated/prisma/enums";
import { passwordService } from "@/modules/auth/services/password.service";
import "dotenv/config"

/**
 * Fails loudly rather than silently skipping — an admin-less production
 * database is a locked-out platform, not a degraded one. Throwing here
 * (instead of a warning + continue) is deliberate: seed.ts's
 * orchestration should stop the whole run rather than report success
 * on an environment nobody can actually administer.
 */
export async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";

  if (!email || !password) {
    throw new Error(
      "[seed-admin] SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set — refusing to seed an admin account without explicit credentials.",
    );
  }

  const passwordHash = await passwordService.hash(password);

  await prisma.user.upsert({
    where: { email },
    update: {
      // Re-running with a new SEED_ADMIN_PASSWORD rotates the bootstrap
      // credential — the one intentional exception to "seeds don't
      // overwrite existing data," since a lost/compromised admin
      // password needs a way to be reset via this same script.
      passwordHash,
    },
    create: {
      username,
      email,
      fullName: "Platform Administrator",
      passwordHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`[seed-admin] Admin account ready (${email}).`);
}

if (require.main === module) {
  seedAdmin()
    .catch((error) => {
      console.error("[seed-admin] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}