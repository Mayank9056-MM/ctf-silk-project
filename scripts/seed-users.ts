// ============================================================================
// seed-users.ts
// ============================================================================
//
// Seeds non-privileged dev/test player accounts. Never touches
// role: SUPER_ADMIN — seed-admin.ts's exclusive responsibility.
// ============================================================================

import prisma from "@/lib/prisma";
import { Role, UserStatus } from "@/app/generated/prisma/enums";
import { passwordService } from "@/modules/auth/services/password.service";
import "dotenv/config";

const DEV_USERS = [
  { username: "ethan_test", email: "ethan.test@example.com", fullName: "Ethan Test" }, // Primary demo account — see seed-demo-progress.ts
  { username: "robert_test", email: "robert.test@example.com", fullName: "Robert Test" },
  { username: "noah_test", email: "noah.test@example.com", fullName: "Noah Test" },
  { username: "player_alpha", email: "alpha@example.com", fullName: "Player Alpha" },
  { username: "player_bravo", email: "bravo@example.com", fullName: "Player Bravo" },
  { username: "player_charlie", email: "charlie@example.com", fullName: "Player Charlie" },
  { username: "player_delta", email: "delta@example.com", fullName: "Player Delta" },
  { username: "player_echo", email: "echo@example.com", fullName: "Player Echo" },
] as const;

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