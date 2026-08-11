// modules/dashboard/services/dashboard.service.ts
import prisma from "@/lib/prisma";
import { eventService } from "@/modules/event/services/event.service";
import { storyService } from "@/modules/story/services/story.service";
import { evidenceService } from "@/modules/story/services/evidence.service";
import { leaderboardService } from "@/modules/leaderboard/services/leaderboard.service";
import { announcementService } from "@/modules/announcement/services/announcement.service";
import { notificationService } from "@/modules/notification/services/notification.service";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import { dashboardLogger as log } from "@/lib/logger/logger.scopes";
import type { AuditActor } from "@/modules/audit/types/audit.types";

import { DASHBOARD_CONSTANTS } from "../constants/dashboard.constants";
import { toDashboardDTO } from "../utils/dashboard.mapper";
import type { DashboardComposition } from "../types/dashboard.types";
import type { DashboardDTO } from "../types/dashboard.dto";

/**
 * Pure orchestration — every number here is computed by an existing
 * domain service; nothing is queried, derived, or authorized in this
 * file. If this module vanished tomorrow, Event/Story/Evidence/
 * Leaderboard/Notification/Announcement would all keep working exactly
 * as they do today, unmodified.
 */
class DashboardService {
  /** userId is resolved by the caller via requireAuth() — this service never resolves identity itself. */
  async getDashboard(userId: string): Promise<DashboardDTO> {
    const [
      eventSummary,
      storyProgress,
      chapterMap,
      evidenceBoard,
      rank,
      leaderboardPreview,
    ] = await Promise.all([
      eventService.getEventSummary(prisma),
      this.getStoryProgressOrNull(userId),
      storyService.getChapterMap(userId),
      this.getEvidenceBoardOrNull(userId),
      leaderboardService.getMyRank(userId),
      leaderboardService.getLeaderboard(
        1,
        DASHBOARD_CONSTANTS.LEADERBOARD_PREVIEW_SIZE,
      ),
    ]);

    // Genuinely optional subsystems — a real failure here must not take
    // down event/story/rank data the player needs to play. Caught
    // independently, logged, degraded to null. NOT the same treatment as
    // storyProgress/evidenceBoard above, which only swallow the expected
    // "not started yet" NOT_FOUND and rethrow anything else.
    const [announcements, notifications] = await Promise.all([
      this.getAnnouncementsOrNull(),
      this.getNotificationsOrNull(userId),
    ]);

    const composition: DashboardComposition = {
      eventSummary,
      storyProgress,
      chapterMap,
      evidenceBoard,
      rank,
      leaderboardPreview,
      announcements,
      notifications,
    };

    return toDashboardDTO(composition);
  }

  /**
   * storyService.getStoryProgress() throws NOT_FOUND for a player who
   * hasn't started rather than bootstrapping a row (deliberately — see
   * that method's own doc comment). Caught here and turned into null,
   * since that's a real, expected state, not an error. Any OTHER error
   * propagates and fails the whole dashboard, since story progress is
   * core, non-optional data.
   *
   * Deliberately NOT storyNavigationService.getCurrentScene(): that
   * method bootstraps a fresh StoryProgress row on first call. Calling
   * it here would mean simply viewing the dashboard silently starts a
   * player's investigation — a correctness bug, not just an
   * inefficiency.
   */
  private async getStoryProgressOrNull(userId: string) {
    try {
      return await storyService.getStoryProgress(userId);
    } catch (error) {
      if (error instanceof ApiError && error.code === ErrorCode.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  }

  /** Same "not started yet" vs. "real error" distinction as getStoryProgressOrNull above — evidenceService.getEvidenceBoard() throws NOT_FOUND when the player has no currentChapterId yet. */
  private async getEvidenceBoardOrNull(userId: string) {
    try {
      return await evidenceService.getEvidenceBoard(userId);
    } catch (error) {
      if (error instanceof ApiError && error.code === ErrorCode.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  }

  /**
   * notificationService requires an AuditActor, not a bare userId — only
   * actorId is ever read by getNotifications()/getUnreadNotificationCount()
   * (both just check `!actor.actorId`), so a minimal actor with the
   * other fields null is safe here: no audit event is written by either
   * method, and no permission check beyond actorId presence applies.
   */
  private buildDashboardActor(userId: string): AuditActor {
    return {
      actorType: "USER",
      actorId: userId,
      actorUsername: null,
      actorRole: null,
    };
  }

  private async getAnnouncementsOrNull() {
    try {
      return await announcementService.getAnnouncements({
        page: 1,
        pageSize: DASHBOARD_CONSTANTS.ANNOUNCEMENT_PREVIEW_SIZE,
      });
    } catch (error) {
      log.error("Dashboard: failed to load announcements preview", error);
      return null;
    }
  }

  private async getNotificationsOrNull(userId: string) {
    try {
      const actor = this.buildDashboardActor(userId);
      const [unreadCount, recent] = await Promise.all([
        notificationService.getUnreadNotificationCount(actor),
        notificationService.getNotifications(actor, {
          page: 1,
          pageSize: DASHBOARD_CONSTANTS.NOTIFICATION_PREVIEW_SIZE,
        }),
      ]);
      return { unreadCount, recent };
    } catch (error) {
      log.error("Dashboard: failed to load notifications preview", error);
      return null;
    }
  }
}

export const dashboardService = new DashboardService();
