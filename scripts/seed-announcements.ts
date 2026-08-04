/**
 * Intentional no-op — see seed-hints.ts's doc comment for the full
 * reasoning. Announcements is a "Future module" with no Announcement/
 * Notification Prisma model yet.
 */
export async function seedAnnouncements(): Promise<void> {
  console.log("  (skipped — no Announcement model exists yet)");
}