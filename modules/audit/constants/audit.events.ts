import {
  AuditAction,
  AuditActorType,
  AuditResourceType,
} from "@/app/generated/prisma/enums";
import { AuditSeverity } from "../types/audit.enums";
import { AuditCategory } from "./audit.categories";

export interface AuditEventDefinition {
  action: AuditAction;
  resourceType: AuditResourceType;
  category: AuditCategory;
  description: string;
  severity: AuditSeverity;
  /** Metadata keys the service MUST receive — checked at write time, not just documented. */
  requiredMetadataKeys?: readonly string[];
  /** Soft hint only — logged as a warning if violated, never blocks a write. */
  expectedActorTypes?: readonly AuditActorType[];
  /** Excluded from bulk CSV/JSON exports even though visible in the admin UI directly. */
  excludeFromExport?: boolean;
}

export const AUDIT_EVENTS = {
  // ═══════════════ Auth ═══════════════
  LOGIN: {
    action: AuditAction.LOGIN,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.AUTHENTICATION,
    description: "A user successfully authenticated.",
    severity: AuditSeverity.INFO,
    expectedActorTypes: [AuditActorType.USER],
  },
  LOGOUT: {
    action: AuditAction.LOGOUT,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.AUTHENTICATION,
    description: "A user ended their session.",
    severity: AuditSeverity.INFO,
  },
  REGISTER: {
    action: AuditAction.REGISTER,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.AUTHENTICATION,
    description: "A new account was created.",
    severity: AuditSeverity.INFO,
  },
  ACCOUNT_LOCKED: {
    action: AuditAction.ACCOUNT_LOCKED,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.SECURITY,
    description:
      "Brute-force protection locked an account after repeated failed logins. Not per-attempt — see LOGIN + success:false for that.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.SYSTEM],
  },
  ACCOUNT_UNLOCKED: {
    action: AuditAction.ACCOUNT_UNLOCKED,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.AUTHENTICATION,
    description: "An account's lock expired or was manually cleared.",
    severity: AuditSeverity.INFO,
  },
  PASSWORD_CHANGED: {
    action: AuditAction.PASSWORD_CHANGED,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.AUTHENTICATION,
    description:
      "A user changed their own password. Vocabulary-ahead-of-feature — no self-service password change exists yet.",
    severity: AuditSeverity.WARNING,
  },
  PASSWORD_RESET_REQUESTED: {
    action: AuditAction.PASSWORD_RESET_REQUESTED,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.AUTHENTICATION,
    description:
      "A password reset flow was initiated. Vocabulary-ahead-of-feature.",
    severity: AuditSeverity.INFO,
  },
  PASSWORD_RESET_COMPLETED: {
    action: AuditAction.PASSWORD_RESET_COMPLETED,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.AUTHENTICATION,
    description: "A password reset was completed. Vocabulary-ahead-of-feature.",
    severity: AuditSeverity.WARNING,
  },
  REFRESH_TOKEN_REUSE_DETECTED: {
    action: AuditAction.REFRESH_TOKEN_REUSE_DETECTED,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.SECURITY,
    description:
      "A revoked refresh token was presented again — the signature of a stolen/replayed token. All sessions for this user were force-revoked.",
    severity: AuditSeverity.CRITICAL,
    expectedActorTypes: [AuditActorType.SYSTEM],
  },
  PERMISSION_DENIED: {
    action: AuditAction.PERMISSION_DENIED,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.SECURITY,
    description:
      "An AUTHENTICATED user attempted an action their role doesn't permit (403). Deliberately excludes bare unauthenticated 401s — too noisy, too little signal.",
    severity: AuditSeverity.WARNING,
    requiredMetadataKeys: ["attemptedPermission"],
    excludeFromExport: true,
  },

  // ═══════════════ User moderation ═══════════════
  USER_BANNED: {
    action: AuditAction.USER_BANNED,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.USER,
    description: "An admin banned a user account.",
    severity: AuditSeverity.CRITICAL,
    expectedActorTypes: [AuditActorType.ADMIN],
  },
  USER_UNBANNED: {
    action: AuditAction.USER_UNBANNED,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.USER,
    description: "An admin lifted a user's ban.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },
  USER_ROLE_CHANGED: {
    action: AuditAction.USER_ROLE_CHANGED,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.USER,
    description: "An admin changed a user's role.",
    severity: AuditSeverity.CRITICAL,
    expectedActorTypes: [AuditActorType.ADMIN],
    requiredMetadataKeys: ["fromRole", "toRole"],
  },

  // ═══════════════ Challenge CMS ═══════════════
  CHALLENGE_CREATED: {
    action: AuditAction.CHALLENGE_CREATED,
    resourceType: AuditResourceType.CHALLENGE,
    category: AuditCategory.CHALLENGE,
    description: "An admin created a new challenge.",
    severity: AuditSeverity.INFO,
    expectedActorTypes: [AuditActorType.ADMIN],
  },
  CHALLENGE_UPDATED: {
    action: AuditAction.CHALLENGE_UPDATED,
    resourceType: AuditResourceType.CHALLENGE,
    category: AuditCategory.CHALLENGE,
    description:
      "An admin edited a challenge's non-flag fields (title, points, prerequisites, etc.). See CHALLENGE_FLAG_CHANGED for flag edits specifically.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },
  CHALLENGE_DELETED: {
    action: AuditAction.CHALLENGE_DELETED,
    resourceType: AuditResourceType.CHALLENGE,
    category: AuditCategory.CHALLENGE,
    description: "An admin deleted a challenge.",
    severity: AuditSeverity.CRITICAL,
    expectedActorTypes: [AuditActorType.ADMIN],
  },
  CHALLENGE_PUBLISHED: {
    action: AuditAction.CHALLENGE_PUBLISHED,
    resourceType: AuditResourceType.CHALLENGE,
    category: AuditCategory.CHALLENGE,
    description: "A challenge went from draft to published.",
    severity: AuditSeverity.INFO,
  },
  CHALLENGE_UNPUBLISHED: {
    action: AuditAction.CHALLENGE_UNPUBLISHED,
    resourceType: AuditResourceType.CHALLENGE,
    category: AuditCategory.CHALLENGE,
    description: "A published challenge was pulled back to draft/archived.",
    severity: AuditSeverity.WARNING,
  },
  CHALLENGE_FLAG_CHANGED: {
    action: AuditAction.CHALLENGE_FLAG_CHANGED,
    resourceType: AuditResourceType.CHALLENGE,
    category: AuditCategory.CHALLENGE,
    description:
      "A challenge's accepted flag was changed. The single highest-stakes admin action in this system — separated from CHALLENGE_UPDATED specifically for that reason. metadata must NEVER include the flag value or hash — redact() already strips anything matching /hash/i, but this is the one event where that matters most.",
    severity: AuditSeverity.CRITICAL,
    expectedActorTypes: [AuditActorType.ADMIN],
  },
  ATTACHMENT_UPLOADED: {
    action: AuditAction.ATTACHMENT_UPLOADED,
    resourceType: AuditResourceType.CHALLENGE,
    category: AuditCategory.CHALLENGE,
    description:
      "A file was attached to a challenge. resourceId is the CHALLENGE's id — the attachment's own id/fileName belongs in metadata.",
    severity: AuditSeverity.INFO,
  },
  ATTACHMENT_DELETED: {
    action: AuditAction.ATTACHMENT_DELETED,
    resourceType: AuditResourceType.CHALLENGE,
    category: AuditCategory.CHALLENGE,
    description:
      "A file was removed from a challenge. Same resourceId convention as ATTACHMENT_UPLOADED.",
    severity: AuditSeverity.WARNING,
  },

  // ═══════════════ Story CMS — Chapter ═══════════════
  CHAPTER_CREATED: {
    action: AuditAction.CHAPTER_CREATED,
    resourceType: AuditResourceType.CHAPTER,
    category: AuditCategory.STORY,
    description: "An admin created a new chapter.",
    severity: AuditSeverity.INFO,
  },
  CHAPTER_UPDATED: {
    action: AuditAction.CHAPTER_UPDATED,
    resourceType: AuditResourceType.CHAPTER,
    category: AuditCategory.STORY,
    description: "An admin edited a chapter's fields.",
    severity: AuditSeverity.WARNING,
  },
  CHAPTER_DELETED: {
    action: AuditAction.CHAPTER_DELETED,
    resourceType: AuditResourceType.CHAPTER,
    category: AuditCategory.STORY,
    description: "An admin deleted a chapter.",
    severity: AuditSeverity.CRITICAL,
  },
  CHAPTER_PUBLISHED: {
    action: AuditAction.CHAPTER_PUBLISHED,
    resourceType: AuditResourceType.CHAPTER,
    category: AuditCategory.STORY,
    description: "A chapter went from draft to published.",
    severity: AuditSeverity.INFO,
  },
  CHAPTER_UNPUBLISHED: {
    action: AuditAction.CHAPTER_UNPUBLISHED,
    resourceType: AuditResourceType.CHAPTER,
    category: AuditCategory.STORY,
    description: "A published chapter was pulled back to draft/archived.",
    severity: AuditSeverity.WARNING,
  },

  // ═══════════════ Story CMS — Scene ═══════════════
  SCENE_CREATED: {
    action: AuditAction.SCENE_CREATED,
    resourceType: AuditResourceType.SCENE,
    category: AuditCategory.STORY,
    description: "An admin created a new scene.",
    severity: AuditSeverity.INFO,
  },
  SCENE_UPDATED: {
    action: AuditAction.SCENE_UPDATED,
    resourceType: AuditResourceType.SCENE,
    category: AuditCategory.STORY,
    description:
      "An admin edited a scene's fields, dialogue, or choices — consolidated deliberately rather than separate DIALOGUE_UPDATED/CHOICE_UPDATED events, since both are sub-content of a scene, not independently significant resources.",
    severity: AuditSeverity.WARNING,
  },
  SCENE_DELETED: {
    action: AuditAction.SCENE_DELETED,
    resourceType: AuditResourceType.SCENE,
    category: AuditCategory.STORY,
    description: "An admin deleted a scene.",
    severity: AuditSeverity.CRITICAL,
  },
  SCENE_PUBLISHED: {
    action: AuditAction.SCENE_PUBLISHED,
    resourceType: AuditResourceType.SCENE,
    category: AuditCategory.STORY,
    description: "A scene went from draft to published.",
    severity: AuditSeverity.INFO,
  },
  SCENE_UNPUBLISHED: {
    action: AuditAction.SCENE_UNPUBLISHED,
    resourceType: AuditResourceType.SCENE,
    category: AuditCategory.STORY,
    description: "A published scene was pulled back to draft/archived.",
    severity: AuditSeverity.WARNING,
  },

  // ═══════════════ Story CMS — Evidence ═══════════════
  EVIDENCE_CREATED: {
    action: AuditAction.EVIDENCE_CREATED,
    resourceType: AuditResourceType.EVIDENCE,
    category: AuditCategory.STORY,
    description: "An admin created a new evidence item.",
    severity: AuditSeverity.INFO,
  },
  EVIDENCE_UPDATED: {
    action: AuditAction.EVIDENCE_UPDATED,
    resourceType: AuditResourceType.EVIDENCE,
    category: AuditCategory.STORY,
    description: "An admin edited an evidence item's fields.",
    severity: AuditSeverity.WARNING,
  },
  EVIDENCE_DELETED: {
    action: AuditAction.EVIDENCE_DELETED,
    resourceType: AuditResourceType.EVIDENCE,
    category: AuditCategory.STORY,
    description: "An admin deleted an evidence item.",
    severity: AuditSeverity.CRITICAL,
  },
  EVIDENCE_PUBLISHED: {
    action: AuditAction.EVIDENCE_PUBLISHED,
    resourceType: AuditResourceType.EVIDENCE,
    category: AuditCategory.STORY,
    description: "An evidence item went from draft to published.",
    severity: AuditSeverity.INFO,
  },
  EVIDENCE_UNPUBLISHED: {
    action: AuditAction.EVIDENCE_UNPUBLISHED,
    resourceType: AuditResourceType.EVIDENCE,
    category: AuditCategory.STORY,
    description: "A published evidence item was pulled back to draft/archived.",
    severity: AuditSeverity.WARNING,
  },

  // ═══════════════ Story CMS — Unlock Rules ═══════════════
  UNLOCK_RULE_CREATED: {
    action: AuditAction.UNLOCK_RULE_CREATED,
    resourceType: AuditResourceType.UNLOCK_RULE,
    category: AuditCategory.STORY,
    description:
      "An admin created a new unlock rule — directly gates what's playable/visible, so this is more consequential than typical CMS content edits.",
    severity: AuditSeverity.WARNING,
  },
  UNLOCK_RULE_UPDATED: {
    action: AuditAction.UNLOCK_RULE_UPDATED,
    resourceType: AuditResourceType.UNLOCK_RULE,
    category: AuditCategory.STORY,
    description: "An admin changed an unlock rule's condition or reference.",
    severity: AuditSeverity.WARNING,
  },
  UNLOCK_RULE_DELETED: {
    action: AuditAction.UNLOCK_RULE_DELETED,
    resourceType: AuditResourceType.UNLOCK_RULE,
    category: AuditCategory.STORY,
    description:
      "An admin deleted an unlock rule — could unintentionally unlock content early. High-value for 'why did this unlock unexpectedly' investigations.",
    severity: AuditSeverity.CRITICAL,
  },

  // ═══════════════ Player-triggered, rare and destructive ═══════════════
  STORY_RESTARTED: {
    action: AuditAction.STORY_RESTARTED,
    resourceType: AuditResourceType.USER,
    category: AuditCategory.STORY,
    description:
      "A player wiped and restarted their own story progress. resourceId is the player's own userId.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.USER],
  },

  // ═══════════════ Leaderboard / Scoring ═══════════════
  LEADERBOARD_FROZEN: {
    action: AuditAction.LEADERBOARD_FROZEN,
    resourceType: AuditResourceType.LEADERBOARD,
    category: AuditCategory.LEADERBOARD,
    description: "An admin froze public leaderboard standings.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },
  LEADERBOARD_UNFROZEN: {
    action: AuditAction.LEADERBOARD_UNFROZEN,
    resourceType: AuditResourceType.LEADERBOARD,
    category: AuditCategory.LEADERBOARD,
    description: "An admin unfroze the leaderboard.",
    severity: AuditSeverity.INFO,
    expectedActorTypes: [AuditActorType.ADMIN],
  },
  LEADERBOARD_RECALCULATED: {
    action: AuditAction.LEADERBOARD_RECALCULATED,
    resourceType: AuditResourceType.LEADERBOARD,
    category: AuditCategory.LEADERBOARD,
    description:
      "An admin triggered a full LeaderboardEntry rebuild from ChallengeSolve — NOT the routine per-solve upsert, which happens on every solve and is never audited. Only the rare, deliberate, manual repair operation.",
    severity: AuditSeverity.CRITICAL,
    expectedActorTypes: [AuditActorType.ADMIN],
  },
  SCORE_ADJUSTED: {
    action: AuditAction.SCORE_ADJUSTED,
    resourceType: AuditResourceType.LEADERBOARD,
    category: AuditCategory.LEADERBOARD,
    description:
      "An admin manually granted or deducted XP outside the normal solve flow. Vocabulary-ahead-of-feature — no manual adjustment mechanism exists yet; build the LeaderboardEntry adjustment path before wiring this.",
    severity: AuditSeverity.CRITICAL,
    expectedActorTypes: [AuditActorType.ADMIN],
    requiredMetadataKeys: ["amount", "reason"],
  },

  // ═══════════════ Event ═══════════════
  EVENT_UPDATED: {
    action: AuditAction.EVENT_UPDATED,
    resourceType: AuditResourceType.EVENT,
    category: AuditCategory.EVENT_MANAGEMENT,
    description:
      "An admin changed the Event singleton row (schedule, title, etc.).",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  // ═══════════════ Exports ═══════════════
  EXPORT_LEADERBOARD: {
    action: AuditAction.EXPORT_LEADERBOARD,
    resourceType: AuditResourceType.SYSTEM,
    category: AuditCategory.EXPORT,
    description: "An admin exported leaderboard standings.",
    severity: AuditSeverity.INFO,
  },
  EXPORT_SUBMISSIONS: {
    action: AuditAction.EXPORT_SUBMISSIONS,
    resourceType: AuditResourceType.SYSTEM,
    category: AuditCategory.EXPORT,
    description: "An admin exported raw submission data.",
    severity: AuditSeverity.WARNING,
  },
  EXPORT_AUDIT: {
    action: AuditAction.EXPORT_AUDIT,
    category: AuditCategory.EXPORT,
    resourceType: AuditResourceType.SYSTEM,
    description: "An admin exported the audit log itself.",
    severity: AuditSeverity.WARNING,
  },

  // ═══════════════ Announcement CMS ═══════════════
  ANNOUNCEMENT_CREATED: {
    action: AuditAction.ANNOUNCEMENT_CREATED,
    resourceType: AuditResourceType.ANNOUNCEMENT,
    category: AuditCategory.CMS,
    description: "An admin created a new announcement.",
    severity: AuditSeverity.INFO,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  ANNOUNCEMENT_UPDATED: {
    action: AuditAction.ANNOUNCEMENT_UPDATED,
    resourceType: AuditResourceType.ANNOUNCEMENT,
    category: AuditCategory.CMS,
    description: "An admin updated an announcement.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  ANNOUNCEMENT_ARCHIVED: {
    action: AuditAction.ANNOUNCEMENT_ARCHIVED,
    resourceType: AuditResourceType.ANNOUNCEMENT,
    category: AuditCategory.CMS,
    description: "An admin archived an announcement.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  // ═══════════════ Admin / Event Operations ═══════════════
  EVENT_PAUSED: {
    action: AuditAction.EVENT_PAUSED,
    resourceType: AuditResourceType.EVENT,
    category: AuditCategory.EVENT_MANAGEMENT,
    description: "An admin paused live event gameplay operations.",
    severity: AuditSeverity.CRITICAL,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  EVENT_RESUMED: {
    action: AuditAction.EVENT_RESUMED,
    resourceType: AuditResourceType.EVENT,
    category: AuditCategory.EVENT_MANAGEMENT,
    description: "An admin resumed live event gameplay operations.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  REGISTRATION_ENABLED: {
    action: AuditAction.REGISTRATION_ENABLED,
    resourceType: AuditResourceType.EVENT,
    category: AuditCategory.EVENT_MANAGEMENT,
    description: "An admin manually enabled event registration.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  REGISTRATION_DISABLED: {
    action: AuditAction.REGISTRATION_DISABLED,
    resourceType: AuditResourceType.EVENT,
    category: AuditCategory.EVENT_MANAGEMENT,
    description: "An admin manually disabled event registration.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  // ═══════════════ Security Operations ═══════════════
  SECURITY_SIGNAL_STATUS_CHANGED: {
    action: AuditAction.SECURITY_SIGNAL_STATUS_CHANGED,
    resourceType: AuditResourceType.SECURITY_SIGNAL,
    category: AuditCategory.SECURITY,
    description: "An admin changed the status of a security signal.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  SECURITY_ALERT_CREATED: {
    action: AuditAction.SECURITY_ALERT_CREATED,
    resourceType: AuditResourceType.SECURITY_ALERT,
    category: AuditCategory.SECURITY,
    description:
      "A security alert was created for administrative investigation.",
    severity: AuditSeverity.CRITICAL,
    expectedActorTypes: [AuditActorType.ADMIN, AuditActorType.SYSTEM],
  },

  SECURITY_ALERT_ACKNOWLEDGED: {
    action: AuditAction.SECURITY_ALERT_ACKNOWLEDGED,
    resourceType: AuditResourceType.SECURITY_ALERT,
    category: AuditCategory.SECURITY,
    description: "An admin acknowledged a security alert.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  SECURITY_ALERT_RESOLVED: {
    action: AuditAction.SECURITY_ALERT_RESOLVED,
    resourceType: AuditResourceType.SECURITY_ALERT,
    category: AuditCategory.SECURITY,
    description: "An admin resolved a security alert.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  SECURITY_ALERT_DISMISSED: {
    action: AuditAction.SECURITY_ALERT_DISMISSED,
    resourceType: AuditResourceType.SECURITY_ALERT,
    category: AuditCategory.SECURITY,
    description: "An admin dismissed a security alert after investigation.",
    severity: AuditSeverity.INFO,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  // ═══════════════ Incident Management ═══════════════
  INCIDENT_CREATED: {
    action: AuditAction.INCIDENT_CREATED,
    resourceType: AuditResourceType.INCIDENT,
    category: AuditCategory.SECURITY,
    description: "An incident was created for operational investigation.",
    severity: AuditSeverity.CRITICAL,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  INCIDENT_ACKNOWLEDGED: {
    action: AuditAction.INCIDENT_ACKNOWLEDGED,
    resourceType: AuditResourceType.INCIDENT,
    category: AuditCategory.SECURITY,
    description: "An admin acknowledged an operational incident.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  INCIDENT_STATUS_CHANGED: {
    action: AuditAction.INCIDENT_STATUS_CHANGED,
    resourceType: AuditResourceType.INCIDENT,
    category: AuditCategory.SECURITY,
    description: "An admin changed the status of an operational incident.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  INCIDENT_RESOLVED: {
    action: AuditAction.INCIDENT_RESOLVED,
    resourceType: AuditResourceType.INCIDENT,
    category: AuditCategory.SECURITY,
    description: "An admin marked an operational incident as resolved.",
    severity: AuditSeverity.WARNING,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  INCIDENT_CLOSED: {
    action: AuditAction.INCIDENT_CLOSED,
    resourceType: AuditResourceType.INCIDENT,
    category: AuditCategory.SECURITY,
    description: "An admin closed an operational incident.",
    severity: AuditSeverity.INFO,
    expectedActorTypes: [AuditActorType.ADMIN],
  },

  // ═══════════════ Emergency Operations ═══════════════
  EMERGENCY_OPERATION: {
    action: AuditAction.EMERGENCY_OPERATION,
    resourceType: AuditResourceType.SYSTEM,
    category: AuditCategory.SECURITY,
    description:
      "An admin performed an emergency/break-glass operation outside the normal admin workflow. Deliberately generic — the specific operation performed belongs in metadata.operationType and the justification in the top-level `reason` field, rather than growing a new AuditAction for every one-off emergency scenario.",
    severity: AuditSeverity.CRITICAL,
    expectedActorTypes: [AuditActorType.ADMIN],
    requiredMetadataKeys: ["operationType"],
  },
} as const satisfies Record<string, AuditEventDefinition>;

export type AuditEventKey = keyof typeof AUDIT_EVENTS;

/**
 * Compile-time exhaustiveness check. A new AuditAction added to the
 * schema without a matching entry above makes this fail to compile —
 * see logger's `assertUnreachable` / unlock.service.ts's condition-type
 * switch for the same pattern applied elsewhere in this build.
 */
type AllActionsRegistered =
  AuditAction extends (typeof AUDIT_EVENTS)[AuditEventKey]["action"]
    ? true
    : never;
const _allActionsRegistered: AllActionsRegistered = true;
void _allActionsRegistered;

export function getAuditEventDefinition(
  key: AuditEventKey,
): AuditEventDefinition {
  return AUDIT_EVENTS[key];
}
