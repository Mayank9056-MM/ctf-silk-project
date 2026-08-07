import type { Announcement } from "@/app/generated/prisma/client";
import { ContentStatus } from "@/app/generated/prisma/enums";
import type { DbClient } from "@/lib/prisma";

import type {
  AnnouncementWithAuthor,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  AnnouncementListQuery,
  AnnouncementListResult,
} from "../types/announcement.types";

class AnnouncementRepository {
  /** Author fields exposed on every AnnouncementWithAuthor read — no email, matching the module's own DTO decision not to expose internal user information beyond a display name. */
  private readonly authorSelect = {
    select: { id: true, fullName: true },
  } as const;

  /**
   * Creates a new announcement. `status` is not set here — the schema's
   * own default (ContentStatus.PUBLISHED) applies, since this module has
   * no publish workflow step for the service to drive separately.
   */
  async createAnnouncement(
    db: DbClient,
    input: CreateAnnouncementInput,
  ): Promise<Announcement> {
    return db.announcement.create({
      data: {
        title: input.title,
        message: input.message,
        priority: input.priority,
        createdById: input.createdById,
      },
    });
  }

  /**
   * A single announcement by id, with its author's display identity.
   * Deliberately unfiltered by status — unlike findAnnouncements, a
   * single-item lookup has a real reason to reach a DRAFT or ARCHIVED
   * row (an admin editing or reviewing one), and nothing in this
   * module's scope asked for the same restriction here.
   */
  async findAnnouncementById(
    db: DbClient,
    announcementId: string,
  ): Promise<AnnouncementWithAuthor | null> {
    return db.announcement.findUnique({
      where: { id: announcementId },
      include: { createdBy: this.authorSelect },
    });
  }

  /**
   * Published announcements, newest first, paginated. rows and count run
   * inside one transaction — see this file's own header for why that's
   * a deliberately stronger guarantee than a plain Promise.all pairing.
   */
  async findAnnouncements(
    db: DbClient,
    query: AnnouncementListQuery,
  ): Promise<AnnouncementListResult> {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const [announcements, total] = await db.$transaction([
      db.announcement.findMany({
        where: { status: ContentStatus.PUBLISHED },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { createdBy: this.authorSelect },
      }),
      db.announcement.count({
        where: { status: ContentStatus.PUBLISHED },
      }),
    ]);

    return { announcements, total };
  }

  /**
   * Updates an existing announcement. Does NOT check whether the row
   * exists first — an update against a nonexistent id fails naturally at
   * the database level, and the service layer decides what that means
   * for the caller, not this method.
   *
   * `id` is taken as its own parameter, separate from
   * UpdateAnnouncementInput.id — the input type already carries an `id`
   * field, making the two slightly redundant; this method uses the
   * explicitly-passed argument for the WHERE clause and leaves
   * `input.id` unused here, matching the three-argument shape requested
   * rather than guessing which one should win.
   *
   * Every content field on UpdateAnnouncementInput is optional — Prisma
   * omits `undefined` values from the UPDATE rather than nulling them
   * out, so a partial edit (title only, say) leaves every other field
   * untouched without this method needing its own branching.
   */
  async updateAnnouncement(
    db: DbClient,
    id: string,
    input: UpdateAnnouncementInput,
  ): Promise<Announcement> {
    const { title, message, priority } = input;

    return db.announcement.update({
      where: { id },
      data: { title, message, priority },
    });
  }

  /** Archives an announcement — a one-column status transition, not a delete. See this file's own header for why. */
  async archiveAnnouncement(db: DbClient, id: string): Promise<Announcement> {
    return db.announcement.update({
      where: { id },
      data: { status: ContentStatus.ARCHIVED },
    });
  }
}

export const announcementRepository = new AnnouncementRepository();