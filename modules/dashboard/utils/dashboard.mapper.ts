// modules/dashboard/utils/dashboard.mapper.ts
import { ChapterProgressState } from "@/modules/story/types/chapter.dto";
import { EvidenceAccessState } from "@/modules/story/types/evidence.dto";
import type { EventState } from "@/modules/event/types/event.types";
import type {
  DashboardComposition,
  DashboardEventState,
  DashboardNextAction,
} from "../types/dashboard.types";
import type { DashboardDTO } from "../types/dashboard.dto";

function toDashboardEventState(
  state: EventState,
  isPaused: boolean,
): DashboardEventState {
  if (state === "EVENT_SOON") return "SOON";
  if (state === "EVENT_ENDED") return "ENDED";
  return isPaused ? "PAUSED" : "LIVE";
}

function toNextAction(
  hasStarted: boolean,
  canAccessGame: boolean,
): DashboardNextAction {
  if (!canAccessGame) return "UNAVAILABLE";
  return hasStarted ? "RESUME_INVESTIGATION" : "BEGIN_INVESTIGATION";
}

/** Pure, deterministic, no fetching, no authorization. */
export function toDashboardDTO(c: DashboardComposition): DashboardDTO {
  const { event, access, countdown } = c.eventSummary;
  const hasStarted = c.storyProgress !== null;

  const completedChapters = c.chapterMap.chapters.filter(
    (ch) => ch.state === ChapterProgressState.COMPLETED,
  ).length;
  const totalChapters = c.chapterMap.chapters.length;
  const activeChapter = c.chapterMap.chapters.find(
    (ch) => ch.state === ChapterProgressState.ACTIVE,
  );

  const evidenceRecovered = c.evidenceBoard
    ? c.evidenceBoard.items.filter(
        (item) => item.state === EvidenceAccessState.DISCOVERED,
      ).length
    : 0;
  const evidenceTotal = c.evidenceBoard ? c.evidenceBoard.items.length : 0;

  return {
    event: {
      state: toDashboardEventState(access.state, access.isPaused),
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      countdown,
      hasStarted: access.hasStarted,
      hasEnded: access.hasEnded,
      isPaused: access.isPaused,
      canAccessGame: access.canAccessGame,
    },
    investigation: {
      hasStarted,
      currentChapterSlug:
        c.storyProgress?.currentChapterSlug ?? activeChapter?.slug ?? null,
      currentSceneSlug: c.storyProgress?.currentSceneSlug ?? null,
      completedChapters,
      totalChapters,
      progressPercent:
        totalChapters > 0
          ? Math.round((completedChapters / totalChapters) * 100)
          : 0,
      nextAction: toNextAction(hasStarted, access.canAccessGame),
    },
    challenges: {
      solved: c.rank.solvedChallenges,
      xp: c.rank.totalXp,
    },
    evidence: c.evidenceBoard
      ? {
          recovered: evidenceRecovered,
          total: evidenceTotal,
          progressPercent:
            evidenceTotal > 0
              ? Math.round((evidenceRecovered / evidenceTotal) * 100)
              : 0,
        }
      : null,
    rank: {
      rank: c.rank.rank,
      totalXp: c.rank.totalXp,
      solvedChallenges: c.rank.solvedChallenges,
      isFrozen: c.rank.isFrozen,
      scope: c.rank.isFrozen ? "FROZEN" : "LIVE",
    },
    leaderboardPreview: {
      isFrozen: c.leaderboardPreview.isFrozen,
      scope: c.leaderboardPreview.isFrozen ? "FROZEN" : "LIVE",
      rows: c.leaderboardPreview.rows,
    },
    announcements: c.announcements?.announcements ?? [],
    notifications: c.notifications
      ? {
          unreadCount: c.notifications.unreadCount.unreadCount,
          recent: c.notifications.recent.notifications,
        }
      : null,
    nextObjective:
      hasStarted && c.storyProgress
        ? {
            destination: "STORY",
            label: "Continue the investigation",
            chapterSlug: c.storyProgress.currentChapterSlug ?? "",
            sceneSlug: c.storyProgress.currentSceneSlug,
          }
        : null,
  };
}