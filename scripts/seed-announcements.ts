// ============================================================================
// seed-announcements.ts
// ============================================================================
//
// Owns Announcement rows exclusively.
//
// CORRECTED against schema.prisma: AnnouncementPriority is
// NORMAL | IMPORTANT | CRITICAL, not INFO | WARNING | CRITICAL as first
// drafted. Also note Announcement.status defaults to PUBLISHED (unlike
// Chapter/Scene/Evidence/Hint, which default to DRAFT) — the DRAFT/ARCHIVED
// rows below set status explicitly rather than relying on any default.
// ============================================================================

import prisma from "@/lib/prisma";
import { AnnouncementPriority, ContentStatus, Role } from "@/app/generated/prisma/enums";
import "dotenv/config";

interface AnnouncementSeed {
  title: string;
  message: string;
  priority: AnnouncementPriority;
  status: ContentStatus;
}

/**
 * Spans every status/priority combination the admin UI and player-facing
 * panel need to render correctly:
 *   - PUBLISHED at each priority, so announcement-priority.tsx's badge
 *     variants are all exercised on a fresh seed.
 *   - one DRAFT, invisible to announcementService.getAnnouncements()
 *     (player-facing) but visible via getAnnouncementForAdmin().
 *   - one ARCHIVED, for testing archiveAnnouncement()'s "already
 *     archived" conflict path and the admin list's filter/badge.
 */
const ANNOUNCEMENTS: AnnouncementSeed[] = [
  {
    title: "Operation Silk Road is live",
    message:
      "The investigation has officially begun. The Prologue is unlocked for every registered player — good luck, Detective.",
    priority: AnnouncementPriority.NORMAL,
    status: ContentStatus.PUBLISHED,
  },
  {
    title: "Scheduled maintenance window",
    message:
      "The platform will briefly pause at 02:00 UTC for a database migration. Your progress is saved automatically and nothing will be lost.",
    priority: AnnouncementPriority.IMPORTANT,
    status: ContentStatus.PUBLISHED,
  },
  {
    title: "Leaderboard freeze in effect",
    message:
      "Final rankings are being calculated. The leaderboard is temporarily frozen and will not reflect new solves until it's lifted.",
    priority: AnnouncementPriority.CRITICAL,
    status: ContentStatus.PUBLISHED,
  },
  {
    title: "Hint pricing update coming",
    message:
      "We're adjusting hint XP costs for Chapter 2 challenges to better balance difficulty. Details to follow once finalized.",
    priority: AnnouncementPriority.NORMAL,
    status: ContentStatus.DRAFT,
  },
  {
    title: "Registration window has closed",
    message: "New player registration closed at the start of the event. This announcement is kept for the record.",
    priority: AnnouncementPriority.NORMAL,
    status: ContentStatus.ARCHIVED,
  },
];

/**
 * createdById must resolve to a real user (Announcement.createdById has
 * onDelete: Restrict, no SetNull escape hatch) — pulling the earliest
 * SUPER_ADMIN keeps this decoupled from seed-admin.ts's env-var email.
 */
async function requireSeedAdmin(): Promise<{ id: string }> {
  const admin = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!admin) {
    throw new Error(
      "[seed-announcements] No SUPER_ADMIN user found — run seed-admin.ts before seed-announcements.ts.",
    );
  }

  return admin;
}

/**
 * Announcement has no unique key besides id — no slug column, and title
 * is deliberately not unique at the schema level (an admin could
 * legitimately reuse a title). Seeds via findFirst-by-title + explicit
 * create/update instead of prisma.announcement.upsert's where clause.
 */
export async function seedAnnouncements(): Promise<void> {
  const admin = await requireSeedAdmin();

  let created = 0;
  let updated = 0;

  for (const announcement of ANNOUNCEMENTS) {
    const existing = await prisma.announcement.findFirst({
      where: { title: announcement.title },
      select: { id: true },
    });

    if (existing) {
      await prisma.announcement.update({
        where: { id: existing.id },
        data: {
          message: announcement.message,
          priority: announcement.priority,
          status: announcement.status,
        },
      });
      updated += 1;
    } else {
      await prisma.announcement.create({
        data: {
          title: announcement.title,
          message: announcement.message,
          priority: announcement.priority,
          status: announcement.status,
          createdById: admin.id,
        },
      });
      created += 1;
    }
  }

  console.log(`[seed-announcements] ${created} created, ${updated} updated (${ANNOUNCEMENTS.length} total).`);
}

if (require.main === module) {
  seedAnnouncements()
    .catch((error) => {
      console.error("[seed-announcements] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}