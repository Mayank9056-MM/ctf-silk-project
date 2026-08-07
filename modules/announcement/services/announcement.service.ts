import {
  Prisma,
  type Announcement,
} from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import { announcementLogger as log } from "@/lib/logger/logger.scopes";

import { hasPermission } from "@/modules/auth/authorization/has-permission";
import { Permission } from "@/modules/auth/authorization/permission";
import { record } from "@/modules/audit/services/audit.service";
import type { AuditActor } from "@/modules/audit/types/audit.types";

import { announcementRepository } from "../repositories/announcement.repository";
import { isArchived, isPublished } from "../utils/announcement-access";
import {
  toAnnouncementDTO,
  toAnnouncementListDTO,
  toCreateAnnouncementDTO,
  toUpdateAnnouncementDTO,
  toArchiveAnnouncementDTO,
  toAdminAnnouncementDTO,
} from "../utils/announcement.mapper";
import type {
  AnnouncementWithAuthor,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  AnnouncementListQuery,
} from "../types/announcement.types";
import type {
  AnnouncementDTO,
  AnnouncementListDTO,
  CreateAnnouncementDTO,
  UpdateAnnouncementDTO,
  ArchiveAnnouncementDTO,
  AnnouncementAdminDTO,
} from "../types/announcement.dto";

class AnnouncementService {
  /**
   * Creates a new announcement. `status` is not set here — the schema's
   * own default (PUBLISHED) applies, since this module has no publish
   * workflow for the service to drive. `createdById` comes from `actor`,
   * not from a separately-supplied input field — see this file's own
   * accompanying note on why that redundancy was deliberately removed
   * from this method's signature.
   */
  async createAnnouncement(
    actor: AuditActor,
    input: Omit<CreateAnnouncementInput, "createdById">,
  ): Promise<CreateAnnouncementDTO> {
    this.assertCanManageAnnouncements(actor);

    if (!actor.actorId) {
      throw ApiError.forbidden(
        ErrorCode.PERMISSION_DENIED,
        "A resolvable actor is required to create an announcement.",
      );
    }

    let created: Announcement;

    try {
      created = await prisma.$transaction(async (tx) => {
        const announcement = await announcementRepository.createAnnouncement(
          tx,
          { ...input, createdById: actor.actorId as string },
        );

        await record(tx, {
          eventKey: "ANNOUNCEMENT_CREATED",
          actor,
          resourceId: announcement.id,
          resourceName: announcement.title,
          success: true,
        });

        return announcement;
      });
    } catch (error) {
      log.error("Unexpected error creating announcement", error, {
        actorId: actor.actorId,
      });
      throw error;
    }

    log.info("Announcement created", {
      actorId: actor.actorId,
      announcementId: created.id,
    });

    return toCreateAnnouncementDTO(created);
  }

  /**
   * Updates an existing announcement. assertAnnouncementExists() is the
   * optimistic pre-check — good UX, a fast, specific 404 for the common
   * case. It is NOT the final guarantee: the actual UPDATE inside the
   * transaction is still wrapped for Prisma's P2025 ("record to update
   * not found"), the authoritative backstop for the rare case where the
   * row stopped existing between the check and the write. Same two-layer
   * reasoning hint.service.ts already applies for P2002 on PlayerHint —
   * here the race window is narrower (this module has no delete path at
   * all), but the pattern still guards against any unexpected
   * inconsistency, not just a specific known cause.
   *
   * before/after are recorded on the audit event — unlike Hint's
   * gameplay events (never audited, since PlayerHint already is the
   * complete record), an admin editing official event communication is
   * exactly the kind of change someone might need to reconstruct later:
   * what did this announcement actually say before it was changed.
   */
  async updateAnnouncement(
    actor: AuditActor,
    id: string,
    input: UpdateAnnouncementInput,
  ): Promise<UpdateAnnouncementDTO> {
    this.assertCanManageAnnouncements(actor);
    const existing = await this.assertAnnouncementExists(id);

    let updated: Announcement;

    try {
      updated = await prisma.$transaction(async (tx) => {
        const result = await this.updateOrThrowNotFound(tx, id, input);

        await record(tx, {
          eventKey: "ANNOUNCEMENT_UPDATED",
          actor,
          resourceId: result.id,
          resourceName: result.title,
          success: true,
          before: {
            title: existing.title,
            message: existing.message,
            priority: existing.priority,
          },
          after: {
            title: result.title,
            message: result.message,
            priority: result.priority,
          },
        });

        return result;
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      log.error("Unexpected error updating announcement", error, {
        actorId: actor.actorId,
        announcementId: id,
      });
      throw error;
    }

    log.info("Announcement updated", {
      actorId: actor.actorId,
      announcementId: id,
    });

    return toUpdateAnnouncementDTO(updated);
  }

  /**
   * Archives an announcement. Rejects with a conflict if it's already
   * archived — archiving is a one-way transition in this module (no
   * restore), so a double-archive attempt is a real, meaningful
   * rejection, not a harmless no-op to silently allow.
   */
  async archiveAnnouncement(
    actor: AuditActor,
    id: string,
  ): Promise<ArchiveAnnouncementDTO> {
    this.assertCanManageAnnouncements(actor);
    const existing = await this.assertAnnouncementExists(id);

    if (isArchived(existing)) {
      throw ApiError.conflict(
        ErrorCode.VALIDATION_ERROR,
        "This announcement is already archived.",
      );
    }

    let archived: Announcement;

    try {
      archived = await prisma.$transaction(async (tx) => {
        let result: Announcement;

        try {
          result = await announcementRepository.archiveAnnouncement(tx, id);
        } catch (error) {
          if (this.isRecordNotFound(error)) {
            throw ApiError.notFound(
              ErrorCode.NOT_FOUND,
              "Announcement not found.",
            );
          }
          throw error;
        }

        await record(tx, {
          eventKey: "ANNOUNCEMENT_ARCHIVED",
          actor,
          resourceId: result.id,
          resourceName: result.title,
          success: true,
        });

        return result;
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      log.error("Unexpected error archiving announcement", error, {
        actorId: actor.actorId,
        announcementId: id,
      });
      throw error;
    }

    log.info("Announcement archived", {
      actorId: actor.actorId,
      announcementId: id,
    });

    return toArchiveAnnouncementDTO(archived);
  }


  async getAnnouncement(id: string): Promise<AnnouncementDTO> {
    const announcement = await this.assertAnnouncementExists(id);

    if (!isPublished(announcement)) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Announcement not found.");
    }

    return toAnnouncementDTO(announcement);
  }

  async getAnnouncementForAdmin(
    actor: AuditActor,
    id: string,
  ): Promise<AnnouncementAdminDTO> {
    this.assertCanManageAnnouncements(actor);

    const announcement = await this.assertAnnouncementExists(id);

    return toAdminAnnouncementDTO(announcement);
  }

  /**
   * Paginated announcement list. Inherently safe by construction, unlike
   * getAnnouncement() above — announcementRepository.findAnnouncements()
   * filters to PUBLISHED at the query level, so there's no gating
   * decision for this method to get wrong or omit.
   */
  async getAnnouncements(
    query: AnnouncementListQuery,
  ): Promise<AnnouncementListDTO> {
    const result = await announcementRepository.findAnnouncements(
      prisma,
      query,
    );
    return toAnnouncementListDTO(result, query.page, query.pageSize);
  }

  // --------------------------------------------------------------------
  // Private helpers — created only where reused across methods
  // --------------------------------------------------------------------

  /**
   * Reused by createAnnouncement, updateAnnouncement, and
   * archiveAnnouncement — the one place "is this actor allowed to
   * manage announcements" is decided, so all three mutations agree on
   * the same rule by construction rather than three independent copies
   * of the same permission check.
   */
  private assertCanManageAnnouncements(actor: AuditActor): void {
    if (
      !actor.actorRole ||
      !hasPermission(actor.actorRole, Permission.MANAGE_ANNOUNCEMENTS)
    ) {
      throw ApiError.forbidden(
        ErrorCode.PERMISSION_DENIED,
        "You do not have permission to manage announcements.",
      );
    }
  }

  /**
   * Reused by updateAnnouncement and archiveAnnouncement — both need the
   * current row (update for its before-snapshot, archive for
   * isArchived()), and both need the identical NOT_FOUND behavior when
   * it's missing. announcement.repository.ts deliberately performs no
   * existence check of its own (see its module header) — this is the
   * only place that gap is closed.
   */
  private async assertAnnouncementExists(
    id: string,
  ): Promise<AnnouncementWithAuthor> {
    const existing = await announcementRepository.findAnnouncementById(
      prisma,
      id,
    );

    if (!existing) {
      throw ApiError.notFound(ErrorCode.NOT_FOUND, "Announcement not found.");
    }

    return existing;
  }

  /**
   * The authoritative backstop behind updateAnnouncement's optimistic
   * pre-check — see that method's own doc comment for the full
   * reasoning. Narrow by design: only P2025 is translated; any other
   * Prisma failure propagates as the real unexpected error it is.
   */
  private async updateOrThrowNotFound(
    tx: Prisma.TransactionClient,
    id: string,
    input: UpdateAnnouncementInput,
  ): Promise<Announcement> {
    try {
      return await announcementRepository.updateAnnouncement(tx, id, input);
    } catch (error) {
      if (this.isRecordNotFound(error)) {
        throw ApiError.notFound(ErrorCode.NOT_FOUND, "Announcement not found.");
      }
      throw error;
    }
  }

  private isRecordNotFound(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    );
  }
}

export const announcementService = new AnnouncementService();
