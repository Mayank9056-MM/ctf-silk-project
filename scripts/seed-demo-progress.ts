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
//
// ----------------------------------------------------------------------
// REWRITE NOTE (this pass)
// ----------------------------------------------------------------------
// seed-story.ts's Prologue expanded from 3 scenes ("cold-open", "the-call",
// "the-file") to the full 15-scene PROLOGUE.md breakdown, and two of those
// scenes are now branching (CHOICE type: "the-supervisor", "the-senior-
// agent"). This script previously parked the demo user's completed-scenes
// list at the old 3-scene stub and pulled a choice off "the-call" — both
// slugs no longer exist. Rewritten below to walk one full path through
// the new Prologue (picking a side at each branch — see the
// PROLOGUE_PATH_SLUGS comment) plus the existing Chapter 1 opener, and to
// record a ChoiceSelection at each branch point actually passed through,
// not just one.
// ============================================================================

import prisma from "@/lib/prisma";
import { StoryProgressStatus, NotificationType, NotificationPriority, NotificationResourceType } from "@/app/generated/prisma/enums";
import "dotenv/config";

const PRIMARY_USER_EMAIL = "ethan.test@example.com";

/**
 * One full walk through the Prologue, in order, choosing the
 * "persistent / pushback" branch at both forks:
 *   - the-supervisor  → supervisor-pushback (not supervisor-accept-quietly)
 *   - the-senior-agent → brooks-full-evidence (not brooks-summary)
 * This is an arbitrary pick for demo/test purposes, not a narrative
 * claim about which branch is "canon" — there is no canonical branch,
 * both are equally valid dummy content.
 */
const PROLOGUE_PATH_SLUGS = [
  "cold-open",
  "crime-scene",
  "funeral",
  "bullpen-three-weeks-later",
  "the-pattern",
  "the-supervisor",
  "supervisor-pushback",
  "the-senior-agent",
  "brooks-full-evidence",
  "the-hidden-phone",
  "robert-shadows",
  "noahs-grave",
  "thesis-statement",
] as const;

// Branch scene slug → the specific Choice.order taken, so ChoiceSelection
// rows line up with PROLOGUE_PATH_SLUGS above. Keep these two in sync if
// the path above ever changes branches.
const BRANCH_CHOICES: { sceneSlug: string; choiceOrder: number }[] = [
  { sceneSlug: "the-supervisor", choiceOrder: 1 }, // "There has to be something here."
  { sceneSlug: "the-senior-agent", choiceOrder: 1 }, // "Lay out every report you found."
];

export async function seedDemoProgress(): Promise<void> {
  const primaryUser = await prisma.user.findUnique({ where: { email: PRIMARY_USER_EMAIL } });
  if (!primaryUser) {
    throw new Error(`[seed-demo-progress] No user found for ${PRIMARY_USER_EMAIL} — did seed-users run first?`);
  }

  const chapter1 = await prisma.chapter.findUnique({ where: { slug: "chapter-1" } });
  const currentScene = await prisma.scene.findFirst({ where: { slug: "the-ledger-photo" } });
  const arriving = await prisma.scene.findFirst({ where: { slug: "arriving-at-scene" } });

  const prologueScenes = await prisma.scene.findMany({
    where: { slug: { in: [...PROLOGUE_PATH_SLUGS] } },
  });
  const prologueSceneBySlug = new Map(prologueScenes.map((s) => [s.slug, s]));

  const missingPrologueSlugs = PROLOGUE_PATH_SLUGS.filter((slug) => !prologueSceneBySlug.has(slug));
  if (!chapter1 || !currentScene || !arriving || missingPrologueSlugs.length > 0) {
    throw new Error(
      `[seed-demo-progress] Required chapters/scenes missing (did seed-story run first?)` +
        (missingPrologueSlugs.length ? ` — missing Prologue slugs: ${missingPrologueSlugs.join(", ")}` : ""),
    );
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
  const completedScenes = [...PROLOGUE_PATH_SLUGS.map((slug) => prologueSceneBySlug.get(slug)!), arriving];
  for (const scene of completedScenes) {
    await prisma.sceneCompletion.upsert({
      where: { userId_sceneId: { userId: primaryUser.id, sceneId: scene.id } },
      update: {},
      create: { userId: primaryUser.id, sceneId: scene.id },
    });
  }

  // ---- ChoiceSelection: the branch taken at each fork actually passed through ----
  for (const branch of BRANCH_CHOICES) {
    const scene = prologueSceneBySlug.get(branch.sceneSlug);
    if (!scene) continue; // already covered by the missing-slug check above; guards TS narrowing only

    const choice = await prisma.choice.findFirst({ where: { sceneId: scene.id, order: branch.choiceOrder } });
    if (!choice) {
      console.warn(`[seed-demo-progress] No choice found at order ${branch.choiceOrder} on scene "${branch.sceneSlug}" — skipping.`);
      continue;
    }

    await prisma.choiceSelection.upsert({
      where: { userId_sceneId: { userId: primaryUser.id, sceneId: scene.id } },
      update: { choiceId: choice.id },
      create: { userId: primaryUser.id, sceneId: scene.id, choiceId: choice.id },
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