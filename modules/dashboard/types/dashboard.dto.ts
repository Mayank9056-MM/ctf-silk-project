// modules/dashboard/types/dashboard.dto.ts
import type {
  DashboardEventState,
  DashboardNextAction,
  DashboardObjectiveDestination,
} from "./dashboard.types";
import type { EventCountdown } from "@/modules/event/types/event.types";
import type { LeaderboardRowDTO } from "@/modules/leaderboard/types/leaderboard.dto";
import type { NotificationDTO } from "@/modules/notification/types/notification.dto";
import type { AnnouncementDTO } from "@/modules/announcement/types/announcement.dto";

export interface DashboardEventDTO {
  state: DashboardEventState;
  startsAt: Date;
  endsAt: Date;
  /** Reused directly from EventCountdown — no reason to redeclare its four number fields a second time. */
  countdown: EventCountdown;
  hasStarted: boolean;
  hasEnded: boolean;
  isPaused: boolean;
  canAccessGame: boolean;
}

/**
 * Chapter-granularity, not scene-granularity — no existing service
 * exposes a story-wide total scene count (StoryProgressDTO has
 * completedSceneCount but no matching total). Chapter progress is what's
 * actually derivable from ChapterMapDTO without inventing a query.
 */
export interface DashboardInvestigationDTO {
  hasStarted: boolean;
  currentChapterSlug: string | null;
  currentSceneSlug: string | null;
  completedChapters: number;
  totalChapters: number;
  progressPercent: number;
  nextAction: DashboardNextAction;
}

/** No `total`/`progressPercent` — no lightweight total-challenge-count method was available to inspect in this session; see the implementation report. */
export interface DashboardChallengesDTO {
  solved: number;
  xp: number;
}

/** Scoped to the player's CURRENT chapter's evidence board — there is no cross-chapter cumulative evidence source anywhere in the codebase. */
export interface DashboardEvidenceDTO {
  recovered: number;
  total: number;
  progressPercent: number;
}

export interface DashboardRankDTO {
  rank: number | null;
  totalXp: number;
  solvedChallenges: number;
  isFrozen: boolean;
  /** Presentation label mirroring isFrozen — never an independent source of truth. */
  scope: "LIVE" | "FROZEN";
}

export interface DashboardLeaderboardPreviewDTO {
  isFrozen: boolean;
  scope: "LIVE" | "FROZEN";
  rows: LeaderboardRowDTO[];
}

export interface DashboardNotificationsDTO {
  unreadCount: number;
  recent: NotificationDTO[];
}

export interface DashboardNextObjectiveDTO {
  destination: DashboardObjectiveDestination;
  label: string;
  chapterSlug: string;
  sceneSlug: string | null;
}

/** No `recentActivity` — no unified activity source exists across Submission/Evidence/Story/Notification; inventing one would be exactly the speculative abstraction this task told me to avoid. */
export interface DashboardDTO {
  event: DashboardEventDTO;
  investigation: DashboardInvestigationDTO;
  challenges: DashboardChallengesDTO;
  evidence: DashboardEvidenceDTO | null;
  rank: DashboardRankDTO;
  leaderboardPreview: DashboardLeaderboardPreviewDTO;
  announcements: AnnouncementDTO[];
  notifications: DashboardNotificationsDTO | null;
  nextObjective: DashboardNextObjectiveDTO | null;
}