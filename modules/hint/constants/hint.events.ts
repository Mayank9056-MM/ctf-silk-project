import { AuditCategory } from "@/modules/audit/constants/audit.categories";
import { AuditSeverity } from "@/modules/audit/types/audit.enums";

// ============================================================================
// hint.events.ts
// ============================================================================
//
// The Hint module is NOT a CMS. Every Hint row is authored exactly once,
// before the event, via scripts/seed-hints.ts. There is no runtime
// create/update/delete/publish path today, and there won't be one while
// an event is live — hints are never touched mid-competition.
//
// So why does an event registry exist for actions that can't happen?
// Because "the Hint module stays script-authored forever" is not a
// guarantee this codebase makes — the project itself is designed to
// evolve into a reusable CTF platform, and a Hint CMS (create/edit/
// publish/archive hints between events, without a redeploy) is a
// realistic next step for exactly that reason. This file is the
// vocabulary for that future CMS's admin actions, designed and reviewed
// NOW, so it doesn't get invented ad hoc — and so this module doesn't
// repeat the exact gap the real AUDIT_EVENTS registry already caught
// itself in once: ACCOUNT_LOCKED and REFRESH_TOKEN_REUSE_DETECTED were
// only added after a review noticed shipped code with zero audit trail.
// Better to have named these before the CMS exists than after.
//
// GAMEPLAY EVENTS ARE DELIBERATELY ABSENT
// -----------------------------------------
// No HINT_UNLOCKED, HINT_VIEWED, or HINT_PURCHASED entry exists here,
// and none should ever be added. The governing test this project
// applies everywhere else in the Audit module applies here identically:
// "Is this a decision someone might need to justify months later, or
// already answerable from a purpose-built table?" PlayerHint — with
// userId, hintId, unlockedAt, and xpSpent — IS that purpose-built table
// for unlock history. A HINT_UNLOCKED audit event would be the exact
// redundancy FIRST_BLOOD was removed for: a second, weaker-typed record
// of a fact PlayerHint already answers precisely. Viewing a hint isn't
// even a state change. Adding gameplay events here would also be
// auditing something that happens at CTF-event frequency and scale —
// routine gameplay is never audited, full stop, per the Audit module's
// own standing rule.
//
// NOT YET WIRED INTO THE REAL AUDIT REGISTRY
// ----------------------------------------------
// This is the important part: these definitions are NOT merged into
// AUDIT_EVENTS, and nothing anywhere calls record() with any of these
// keys. AUDIT_EVENTS's real keys are backed by AuditAction, a Postgres
// ENUM column today — adding HINT_CREATED etc. as genuinely recordable
// events would require new AuditAction enum members AND a new
// AuditResourceType value ("HINT"), both real schema migrations, for a
// CMS module that does not exist. That is precisely what this project's
// architecture rules forbid: naming vocabulary ahead of a real,
// scheduled feature is fine; a table or migration is not. So `action`
// and `resourceType` below are typed as plain strings, NOT the live
// Prisma-backed AuditAction/AuditResourceType enums — because those
// enum members don't exist yet, and pretending otherwise would let this
// file silently type-check against a registry it isn't actually part of.
//
// MIGRATION PATH, WHEN A HINT CMS IS ACTUALLY SCHEDULED
// ----------------------------------------------------------
// 1. Add the needed AuditAction enum members and an "HINT" AuditResourceType
//    value via a real Prisma migration.
// 2. Merge HINT_EVENTS's entries directly into AUDIT_EVENTS, swapping the
//    string-typed action/resourceType fields for the real enum values.
// 3. Delete this file — its job is done once its contents live in the
//    one real registry.
// ============================================================================

/**
 * Same shape as audit.events.ts's AuditEventDefinition, minus the two
 * fields this file can't honestly claim yet — see the module header.
 * `action`/`resourceType` stay as plain strings rather than the real
 * Prisma enums specifically so this type never accidentally
 * type-checks as interchangeable with a live AuditEventDefinition.
 */
export interface HintEventDefinition {
  /** Not yet a real AuditAction enum member. */
  readonly action: string;
  /** Not yet a real AuditResourceType enum member. */
  readonly resourceType: string;
  readonly category: AuditCategory;
  readonly severity: AuditSeverity;
  readonly description: string;
}

/**
 * The full future admin-lifecycle vocabulary for a Hint CMS. Every
 * entry uses AuditCategory.CMS — the same category Evidence/UnlockRule
 * authoring events already use — since a hint's lifecycle is
 * indistinguishable in kind from any other piece of admin-authored
 * content.
 */
export const HINT_EVENTS = {
  HINT_CREATED: {
    action: "HINT_CREATED",
    resourceType: "HINT",
    category: AuditCategory.CMS,
    severity: AuditSeverity.INFO,
    description: "A new hint was authored for a challenge.",
  },

  /**
   * Covers ordinary edits — content, level, status transitions other
   * than publish/archive (which get their own entries below, since
   * those specifically change player-facing visibility, not just
   * content).
   */
  HINT_UPDATED: {
    action: "HINT_UPDATED",
    resourceType: "HINT",
    category: AuditCategory.CMS,
    severity: AuditSeverity.INFO,
    description: "An existing hint's content, level, or metadata was edited.",
  },

  /**
   * Split out from generic HINT_UPDATED for the same reason
   * CHALLENGE_FLAG_CHANGED was split out from CHALLENGE_UPDATED in the
   * real audit registry: xpCost directly affects scoring for every
   * player who unlocks the hint afterward, making it the single
   * highest-stakes field on this model — worth its own event and
   * elevated severity rather than blending into routine edits.
   */
  HINT_XP_COST_CHANGED: {
    action: "HINT_XP_COST_CHANGED",
    resourceType: "HINT",
    category: AuditCategory.CMS,
    severity: AuditSeverity.WARNING,
    description:
      "A hint's xpCost was changed — affects scoring for every player who unlocks it after this change.",
  },

  HINT_DELETED: {
    action: "HINT_DELETED",
    resourceType: "HINT",
    category: AuditCategory.CMS,
    severity: AuditSeverity.WARNING,
    description: "A hint was permanently removed.",
  },

  HINT_PUBLISHED: {
    action: "HINT_PUBLISHED",
    resourceType: "HINT",
    category: AuditCategory.CMS,
    severity: AuditSeverity.INFO,
    description:
      "A hint's status moved to PUBLISHED, making it visible to players for the first time.",
  },

  HINT_ARCHIVED: {
    action: "HINT_ARCHIVED",
    resourceType: "HINT",
    category: AuditCategory.CMS,
    severity: AuditSeverity.INFO,
    description:
      "A hint's status moved to ARCHIVED, removing it from player visibility without deleting the row.",
  },
} as const satisfies Record<string, HintEventDefinition>;

export type HintEventKey = keyof typeof HINT_EVENTS;