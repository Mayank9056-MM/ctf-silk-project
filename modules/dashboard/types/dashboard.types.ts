// modules/dashboard/types/dashboard.types.ts
import type {
  EventAccess,
  EventCountdown,
} from "@/modules/event/types/event.types";
import type { StoryProgressDTO } from "@/modules/story/types/progress.dto";
import type { ChapterMapDTO } from "@/modules/story/types/chapter.dto";
import type { EvidenceBoardDTO } from "@/modules/story/types/evidence.dto";
import type {
  UserRankDTO,
  LeaderboardDTO,
} from "@/modules/leaderboard/types/leaderboard.dto";
import type { AnnouncementListDTO } from "@/modules/announcement/types/announcement.dto";
import type {
  NotificationListDTO,
  UnreadNotificationCountDTO,
} from "@/modules/notification/types/notification.dto";
import type { Event } from "@/app/generated/prisma/client";

/**
 * Raw composition gathered concurrently in DashboardService.getDashboard().
 * No shape transformation happens here — that's dashboard.mapper.ts's job.
 *
 * storyProgress/evidenceBoard are null when the player hasn't started —
 * both source methods throw NOT_FOUND for that case (getStoryProgress,
 * getEvidenceBoard), caught and converted to null by the service. This is
 * an expected STATE, not a subsystem failure, unlike announcements/
 * notifications below.
 *
 * announcements/notifications are optional in a different sense: a
 * genuine failure in either (not a "not started yet" state, an actual
 * error) must not take down event/story/rank data the player needs to
 * play — see dashboard.service.ts's own try/catch treatment of these
 * two specifically.
 */
export interface DashboardComposition {
  eventSummary: {
    event: Pick<Event, "startsAt" | "endsAt">;
    access: EventAccess;
    countdown: EventCountdown;
  };
  storyProgress: StoryProgressDTO | null;
  chapterMap: ChapterMapDTO;
  evidenceBoard: EvidenceBoardDTO | null;
  rank: UserRankDTO;
  leaderboardPreview: LeaderboardDTO;
  announcements: AnnouncementListDTO | null;
  notifications: {
    unreadCount: UnreadNotificationCountDTO;
    recent: NotificationListDTO;
  } | null;
}

/**
 * Presentation-only lifecycle label, NOT a reused domain enum. The real
 * EventState (event.types.ts) is deliberately 3-valued
 * ("EVENT_SOON"|"EVENT_LIVE"|"EVENT_ENDED") — pause is expressed as a
 * separate `isPaused` boolean on EventAccess, by design, specifically so
 * existing consumers switching on `state` never had to handle a fourth
 * case. This 4-valued type exists only for the dashboard UI, which
 * genuinely wants "paused" as its own visual state; it is derived from
 * (state, isPaused), never authoritative on its own.
 */
export type DashboardEventState = "SOON" | "LIVE" | "PAUSED" | "ENDED";

export type DashboardNextAction =
  | "BEGIN_INVESTIGATION"
  | "RESUME_INVESTIGATION"
  | "UNAVAILABLE";

/** Only ever "STORY" today — see dashboard.mapper.ts for why CHALLENGES/EVIDENCE are never produced (no recommendation logic exists anywhere in the reviewed backend). */
export type DashboardObjectiveDestination = "STORY";
