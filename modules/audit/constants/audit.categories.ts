// audit.categories.ts


/**
 * Top-level domain classification for every audit event on the platform.
 *
 * String enum (not numeric) is used deliberately:
 *   - Values are stored directly in PostgreSQL as human-readable strings,
 *     so DB rows are self-describing without a lookup/join.
 *   - String values survive enum reordering — numeric enums are fragile
 *     the moment someone inserts a member in the middle.
 *   - CSV/JSON exports for compliance auditors are readable without a
 *     translation layer.
 */
export enum AuditCategory {
  /**
   * Login, logout, session lifecycle, MFA, password resets, OAuth flows,
   * token refresh/revocation.
   *
   * Why it exists: Authentication is the single most scrutinized domain
   * in any security audit (SOC2, ISO 27001, internal incident response).
   * It must be filterable in isolation, independent of "Security" (below),
   * because most authentication events are routine (a login) while
   * Security events are inherently anomalous (a blocked intrusion attempt).
   */
  AUTHENTICATION = 'AUTHENTICATION',

  /**
   * Story chapters, scenes, dialogue nodes, choices, branching logic,
   * evidence board unlocks, narrative state transitions.
   *
   * Why it exists: This platform's core differentiator is the story
   * engine. Narrative-design admins need to audit story mutations
   * (e.g. "who edited Chapter 3, Scene 2 last?") completely separately
   * from challenge/CTF content — different teams own these domains.
   */
  STORY = 'STORY',

  /**
   * Challenge creation/editing, flag configuration changes, hint
   * publication, challenge visibility toggles, unlock rule changes.
   *
   * Why it exists: Challenge integrity is a competitive-integrity concern
   * distinct from story integrity. If a flag is edited mid-event, this
   * must be independently auditable and exportable for post-event
   * dispute resolution ("the flag changed while I was solving it").
   *
   * NOTE: An individual player's flag *submission* is gameplay data,
   * not an audit event — it lives in a ChallengeSolve table (see
   * "Audit vs. Metrics vs. Domain Data" in the module header of
   * audit.events.ts). Only *administrative* mutations to challenges
   * belong here.
   */
  CHALLENGE = 'CHALLENGE',

  /**
   * Leaderboard recalculations, manual score adjustments, disqualifications,
   * rank freezes/unfreezes, tie-break rule changes.
   *
   * Why it exists: Leaderboard disputes are the #1 source of post-event
   * complaints in competitive CTFs. A manual score adjustment or
   * disqualification MUST be independently auditable with actor, reason,
   * and timestamp — this is the evidentiary trail for dispute resolution.
   */
  LEADERBOARD = 'LEADERBOARD',

  /**
   * Event (the competition itself) lifecycle: creation, scheduling,
   * start/pause/resume/end, registration window changes, capacity changes.
   *
   * Why it exists: "Event" here means the competition instance, not a
   * generic domain event. Distinct from STORY/CHALLENGE because it
   * governs *when* and *whether* the whole platform is live — these
   * are the highest-blast-radius administrative actions on the platform.
   */
  EVENT_MANAGEMENT = 'EVENT_MANAGEMENT',

  /**
   * User account administration: role changes, bans/unbans, team
   * assignment/reassignment, profile field edits by an admin,
   * account merges.
   *
   * Why it exists: Distinct from AUTHENTICATION (which is about proving
   * identity) — USER is about *administering* an identity once it
   * exists. Role/permission changes are a classic compliance-audit
   * requirement (principle of least privilege reviews).
   */
  USER = 'USER',

  /**
   * Admin CMS content operations that don't fall under STORY or
   * CHALLENGE specifically: static page edits, announcement banners,
   * FAQ/help content, media library management, template edits.
   *
   * Why it exists: Keeps STORY (narrative-critical, high scrutiny)
   * uncluttered by low-stakes content edits like banner text changes,
   * while still keeping those edits auditable for accountability.
   */
  CMS = 'CMS',

  /**
   * Detected or blocked malicious activity: rate-limit violations,
   * brute-force lockouts, anomalous submission patterns, WAF/blocklist
   * hits, flag-sharing detection, suspicious IP/device fingerprint flags.
   *
   * Why it exists: Security events are inherently reactive and
   * high-severity by nature — they need their own category so the
   * Security Officer role can be granted visibility into ONLY this
   * category without seeing routine admin activity. This is an
   * access-control boundary, not just a filter convenience.
   */
  SECURITY = 'SECURITY',

  /**
   * Break-glass and incident-response actions: emergency event pause,
   * emergency broadcast to all players, manual override of automated
   * scoring/anti-cheat decisions, emergency admin elevation.
   *
   * Why it exists: These are rare, high-blast-radius, "something is on
   * fire" actions. Isolating them from ordinary SECURITY events prevents
   * a genuine incident from being buried in routine rate-limit noise
   * during a live 2,000-participant event when triage speed matters most.
   */
  EMERGENCY = 'EMERGENCY',

  /**
   * Data export operations: audit log exports, leaderboard exports,
   * participant PII exports, compliance report generation.
   *
   * Why it exists: Exporting data is itself a security-sensitive action
   * (data exfiltration risk) that must be independently auditable —
   * "who exported what, and when" is a standard compliance question
   * that's awkward to answer if export events are scattered across
   * other categories. Also enables enforcing excludeFromExport correctly
   * (export-of-exports must never recurse).
   */
  EXPORT = 'EXPORT',

  /**
   * Anti-cheat and integrity enforcement: submission flagged for review,
   * collusion detected, content moderation actions (chat/forum if present),
   * warning issued, appeal outcomes.
   *
   * Why it exists: Distinct from SECURITY (system/infra-level threats)
   * and USER (account admin) — MODERATION is specifically about
   * enforcing fair-play and community-conduct rules against a *player's
   * behavior*, with its own escalation/appeal lifecycle worth tracking
   * end-to-end.
   */
  MODERATION = 'MODERATION',

  /**
   * Data recovery and rollback operations: restoring a deleted scene,
   * reverting a challenge to a previous version, database point-in-time
   * recovery triggers, undo operations on destructive admin actions.
   *
   * Why it exists: Recovery actions are the direct evidence trail after
   * a mistake occurred. They must be separately auditable from the
   * original destructive action (which is audited under its own
   * category, e.g. STORY or CHALLENGE) to reconstruct a clean incident
   * timeline: "deleted at T1 (STORY), restored at T2 (RECOVERY)."
   */
  RECOVERY = 'RECOVERY',

  /**
   * Platform-internal/system-level events that don't belong to a
   * player-facing or admin-facing domain: scheduled job execution,
   * migration runs, feature-flag toggles, configuration changes,
   * integration/webhook failures.
   *
   * Why it exists: The deliberate catch-all for platform-operational
   * events. Prevents category proliferation — an ambiguous event
   * belongs here rather than justifying a new one-off category.
   * If a category other than SYSTEM ever contains only 1-2 events,
   * it's a signal those events belong here instead.
   */
  SYSTEM = 'SYSTEM',
}

// ----------------------------------------------------------------------------
// Category metadata registry
// ----------------------------------------------------------------------------
//
// Human-readable label + dashboard color + default visibility tier per
// category, keyed off the enum so it's impossible to add a category without
// a compile error here (see the exhaustiveness check below).
//
// This is intentionally a single source of truth consumed by:
//   - Admin dashboard category filter dropdown (label, color)
//   - Audit viewer RBAC gate (restrictedTo)
//   - Metrics dashboard category legend (color)
// ----------------------------------------------------------------------------

/**
 * Minimum admin tier permitted to VIEW audit events in a given category.
 * Ordering is intentional: higher number = more restricted.
 * Kept here (not in a separate RBAC file) because visibility is an
 * intrinsic property of the category's sensitivity, decided at the same
 * time the category itself is designed.
 */
export enum AuditCategoryVisibility {
  /** Any admin with general audit-log read access. */
  STANDARD = 'STANDARD',
  /** Lead Admins and above only. */
  ELEVATED = 'ELEVATED',
  /** Security Officers and Lead Admins only — regardless of general admin tier. */
  RESTRICTED = 'RESTRICTED',
}

export interface AuditCategoryMetadata {
  /** Human-readable label rendered in the admin dashboard filter UI. */
  readonly label: string;
  /** Short explanation shown as a tooltip in the dashboard filter UI. */
  readonly description: string;
  /**
   * Hex color used consistently across the audit table, metrics charts,
   * and category badges — kept centralized so a category's color never
   * drifts between two dashboard surfaces.
   */
  readonly color: `#${string}`;
  /** Minimum visibility tier required to view this category's events. */
  readonly visibility: AuditCategoryVisibility;
}

/**
 * Central metadata registry, one entry per AuditCategory.
 * `satisfies Record<...>` (rather than a type annotation) preserves the
 * literal key types while still enforcing that every enum member has an
 * entry — omitting one is a compile-time error.
 */
export const AUDIT_CATEGORY_METADATA = {
  [AuditCategory.AUTHENTICATION]: {
    label: 'Authentication',
    description: 'Login, session, MFA, and credential events.',
    color: '#3B82F6',
    visibility: AuditCategoryVisibility.STANDARD,
  },
  [AuditCategory.STORY]: {
    label: 'Story',
    description: 'Narrative content: chapters, scenes, dialogue, choices.',
    color: '#8B5CF6',
    visibility: AuditCategoryVisibility.STANDARD,
  },
  [AuditCategory.CHALLENGE]: {
    label: 'Challenge',
    description: 'CTF challenge configuration and flag integrity.',
    color: '#EC4899',
    visibility: AuditCategoryVisibility.STANDARD,
  },
  [AuditCategory.LEADERBOARD]: {
    label: 'Leaderboard',
    description: 'Score adjustments, disqualifications, rank changes.',
    color: '#F59E0B',
    visibility: AuditCategoryVisibility.ELEVATED,
  },
  [AuditCategory.EVENT_MANAGEMENT]: {
    label: 'Event Management',
    description: 'Competition lifecycle: scheduling, start/pause/end.',
    color: '#10B981',
    visibility: AuditCategoryVisibility.ELEVATED,
  },
  [AuditCategory.USER]: {
    label: 'User',
    description: 'Account administration: roles, bans, team assignment.',
    color: '#06B6D4',
    visibility: AuditCategoryVisibility.STANDARD,
  },
  [AuditCategory.CMS]: {
    label: 'CMS',
    description: 'Static content: pages, announcements, media library.',
    color: '#84CC16',
    visibility: AuditCategoryVisibility.STANDARD,
  },
  [AuditCategory.SECURITY]: {
    label: 'Security',
    description: 'Detected or blocked malicious activity.',
    color: '#EF4444',
    visibility: AuditCategoryVisibility.RESTRICTED,
  },
  [AuditCategory.EMERGENCY]: {
    label: 'Emergency',
    description: 'Break-glass and incident-response actions.',
    color: '#DC2626',
    visibility: AuditCategoryVisibility.RESTRICTED,
  },
  [AuditCategory.EXPORT]: {
    label: 'Export',
    description: 'Data export and compliance report generation.',
    color: '#6366F1',
    visibility: AuditCategoryVisibility.ELEVATED,
  },
  [AuditCategory.MODERATION]: {
    label: 'Moderation',
    description: 'Anti-cheat, fair-play enforcement, appeals.',
    color: '#F97316',
    visibility: AuditCategoryVisibility.ELEVATED,
  },
  [AuditCategory.RECOVERY]: {
    label: 'Recovery',
    description: 'Restore, rollback, and undo operations.',
    color: '#14B8A6',
    visibility: AuditCategoryVisibility.ELEVATED,
  },
  [AuditCategory.SYSTEM]: {
    label: 'System',
    description: 'Platform-internal operational events.',
    color: '#6B7280',
    visibility: AuditCategoryVisibility.STANDARD,
  },
} as const satisfies Record<AuditCategory, AuditCategoryMetadata>;

/**
 * Ordered list of all categories, precomputed once for dashboard dropdowns
 * (avoids calling Object.values(AuditCategory) — including numeric reverse
 * mappings — at every render; string enums don't have that problem, but this
 * keeps ordering explicit and independent of enum declaration order).
 */
export const AUDIT_CATEGORY_LIST: readonly AuditCategory[] = [
  AuditCategory.AUTHENTICATION,
  AuditCategory.SECURITY,
  AuditCategory.EMERGENCY,
  AuditCategory.USER,
  AuditCategory.STORY,
  AuditCategory.CHALLENGE,
  AuditCategory.LEADERBOARD,
  AuditCategory.MODERATION,
  AuditCategory.EVENT_MANAGEMENT,
  AuditCategory.CMS,
  AuditCategory.RECOVERY,
  AuditCategory.EXPORT,
  AuditCategory.SYSTEM,
] as const;

/**
 * Categories whose events are visible only to Security Officers / Lead
 * Admins. Derived from the metadata registry rather than hand-maintained,
 * so it can never drift out of sync with AUDIT_CATEGORY_METADATA.
 */
export const RESTRICTED_AUDIT_CATEGORIES: readonly AuditCategory[] =
  AUDIT_CATEGORY_LIST.filter(
    (category) =>
      AUDIT_CATEGORY_METADATA[category].visibility ===
      AuditCategoryVisibility.RESTRICTED,
  );

/**
 * Type guard used at the API boundary (e.g. validating a `?category=`
 * query param on the audit export endpoint) before it's trusted as an
 * AuditCategory.
 */
export function isAuditCategory(value: string): value is AuditCategory {
  return (AUDIT_CATEGORY_LIST as readonly string[]).includes(value);
}