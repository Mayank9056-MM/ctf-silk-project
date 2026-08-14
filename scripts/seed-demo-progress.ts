// ============================================================================
// seed-demo-progress.ts
// ============================================================================
//
// Owns per-player DEMO state only: StoryProgress, SceneCompletion,
// ChoiceSelection, Submission, ChallengeSolve, LeaderboardEntry,
// Notification. Purely cosmetic seed data so the dashboard/story UI don't
// render empty on a fresh database.
//
// CORRECTED against schema.prisma:
//   - Submission has no unique constraint on (userId, challengeId), only
//     indexes — the compound-key "already solved" record is ChallengeSolve
//     (@@id([userId, challengeId])), which references the originating
//     Submission via a separate submissionId @unique. A solve is therefore
//     two rows, written together, not one upsert.
//   - Notification uses readAt: DateTime | null, not an isRead boolean.
// ============================================================================

import prisma from "@/lib/prisma";
import { StoryProgressStatus, NotificationType, NotificationPriority, NotificationResourceType } from "@/app/generated/prisma/enums";
import "dotenv/config";

const PRIMARY_USER_EMAIL = "ethan.test@example.com";

export async function seedDemoProgress(): Promise<void> {
  const primaryUser = await prisma.user.findUnique({ where: { email: PRIMARY_USER_EMAIL } });
  if (!primaryUser) {
    throw new Error(`[seed-demo-progress] No user found for ${PRIMARY_USER_EMAIL} — did seed-users run first?`);
  }

  const [chapter1] = await Promise.all([prisma.chapter.findUnique({ where: { slug: "chapter-1" } })]);
  const currentScene = await prisma.scene.findFirst({ where: { slug: "the-ledger-photo" } });
  const coldOpen = await prisma.scene.findFirst({ where: { slug: "cold-open" } });
  const theCall = await prisma.scene.findFirst({ where: { slug: "the-call" } });
  const theFile = await prisma.scene.findFirst({ where: { slug: "the-file" } });
  const arriving = await prisma.scene.findFirst({ where: { slug: "arriving-at-scene" } });
  const callChoice = await prisma.choice.findFirst({ where: { sceneId: theCall?.id, order: 1 } });

  if (!chapter1 || !currentScene || !coldOpen || !theCall || !theFile || !arriving) {
    throw new Error("[seed-demo-progress] Required chapters/scenes missing — did seed-story run first?");
  }

  // ---- StoryProgress: parked mid-Chapter-1 ----
  await prisma.storyProgress.upsert({
    where: { userId: primaryUser.id },
    update: {
      currentChapterId: chapter1.id,
      currentSceneId: currentScene.id,
      status: StoryProgressStatus.IN_PROGRESS,
    },
    create: {
      userId: primaryUser.id,
      currentChapterId: chapter1.id,
      currentSceneId: currentScene.id,
      status: StoryProgressStatus.IN_PROGRESS,
      startedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
    },
  });

  // ---- SceneCompletion: everything strictly before currentScene ----
  for (const scene of [coldOpen, theCall, theFile, arriving]) {
    await prisma.sceneCompletion.upsert({
      where: { userId_sceneId: { userId: primaryUser.id, sceneId: scene.id } },
      update: {},
      create: { userId: primaryUser.id, sceneId: scene.id },
    });
  }

  // ---- ChoiceSelection: the branch taken in the-call ----
  if (callChoice) {
    await prisma.choiceSelection.upsert({
      where: { userId_sceneId: { userId: primaryUser.id, sceneId: theCall.id } },
      update: { choiceId: callChoice.id },
      create: { userId: primaryUser.id, sceneId: theCall.id, choiceId: callChoice.id },
    });
  }

  // ---- Submissions + ChallengeSolve + LeaderboardEntry across dev users ----
  const overdoseChallenge = await prisma.challenge.findFirst({
    where: { slug: "the-overdose-report" },
    include: { chapter: { select: { order: true } } },
  });
  const allUsers = await prisma.user.findMany({ where: { role: "USER" } });

  if (overdoseChallenge) {
    // Roughly half the players have solved the first challenge — enough
    // for a non-flat leaderboard ordering.
    for (const [index, user] of allUsers.entries()) {
      const shouldSolve = index % 2 === 0;
      if (!shouldSolve) continue;

      const alreadySolved = await prisma.challengeSolve.findUnique({
        where: { userId_challengeId: { userId: user.id, challengeId: overdoseChallenge.id } },
      });
      if (alreadySolved) continue;

      const submission = await prisma.submission.create({
        data: {
          userId: user.id,
          challengeId: overdoseChallenge.id,
          isCorrect: true,
          // submittedFlag/submittedFlagHash intentionally left null — no
          // reason for a seed script to fabricate a plausible-looking flag.
        },
      });

      await prisma.challengeSolve.create({
        data: {
          userId: user.id,
          challengeId: overdoseChallenge.id,
          submissionId: submission.id,
          xpAwarded: overdoseChallenge.xpReward,
        },
      });

      await prisma.leaderboardEntry.upsert({
        where: { userId: user.id },
        update: {
          totalXp: { increment: overdoseChallenge.xpReward },
          solvedChallenges: { increment: 1 },
          lastSolvedAt: new Date(),
          highestChapter: overdoseChallenge.chapter.order,
          highestDisplayOrder: overdoseChallenge.displayOrder,
        },
        create: {
          userId: user.id,
          totalXp: overdoseChallenge.xpReward,
          solvedChallenges: 1,
          lastSolvedAt: new Date(),
          highestChapter: overdoseChallenge.chapter.order,
          highestDisplayOrder: overdoseChallenge.displayOrder,
        },
      });
    }
  }

  // ---- Notifications for the primary demo account ----
  const liveAnnouncement = await prisma.announcement.findFirst({
    where: { title: "Operation Silk Road is live" },
    select: { id: true },
  });

  await prisma.notification.deleteMany({ where: { userId: primaryUser.id } });
  await prisma.notification.createMany({
    data: [
      {
        userId: primaryUser.id,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.NORMAL,
        title: "New evidence unlocked",
        message: "The Wallet Ledger is now available on your investigation board.",
        readAt: null,
      },
      {
        userId: primaryUser.id,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
        title: "Challenge solved",
        message: 'You cracked "The Overdose Report" — 100 XP awarded.',
        readAt: new Date(Date.now() - 1000 * 60 * 20), // already read 20 min ago
      },
      ...(liveAnnouncement
        ? [
            {
              userId: primaryUser.id,
              type: NotificationType.ANNOUNCEMENT,
              priority: NotificationPriority.NORMAL,
              title: "Operation Silk Road is live",
              message: "A new announcement was posted.",
              resourceType: NotificationResourceType.ANNOUNCEMENT,
              resourceId: liveAnnouncement.id,
              readAt: null,
            },
          ]
        : []),
    ],
  });

  console.log(`[seed-demo-progress] Demo progress ready for ${PRIMARY_USER_EMAIL}.`);
}

if (require.main === module) {
  seedDemoProgress()
    .catch((error) => {
      console.error("[seed-demo-progress] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}