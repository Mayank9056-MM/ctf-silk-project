// ============================================================================
// audit.service.ts
// ============================================================================

import { AuditActorType } from "@/app/generated/prisma/enums";
import type { DbClient } from "@/lib/prisma";
import { redact } from "@/lib/logger/redact";
import { auditLogger as log } from "@/lib/logger/logger.scopes";
import { getRequestMetadata } from "@/lib/get-request-metadata";
import type { Prisma } from "@/app/generated/prisma/client";

import {
  getAuditEventDefinition,
  type AuditEventKey,
} from "../constants/audit.events";
import {
  create,
  createMany,
  type CreateAuditLogInput,
} from "../repositories/audit.repository";
import type {
  AuditActor,
  AuditRecordInput,
  AuditRequestContext,
  AuditMetadata,
  AuditSnapshot,
} from "../types/audit.types";

// ----------------------------------------------------------------------------
// Public input shape
// ----------------------------------------------------------------------------

/**
 * What every call site in the app actually hands to record(). Deliberately
 * NOT audit.types.ts's AuditRecordInput — that's this service's internal
 * assembled representation (see module header). This is the raw,
 * pre-redaction, pre-resolution shape: no resourceType (derived from
 * AUDIT_EVENTS[eventKey], never caller-supplied — the same reasoning
 * that already keeps category/severity out of a call site's hands,
 * applied one layer further), before/after/metadata are plain unredacted
 * objects, context is an optional override for callers outside a normal
 * request (background jobs, cron).
 */
export interface RecordAuditEventInput {
  readonly eventKey: AuditEventKey;
  readonly actor: AuditActor;
  readonly resourceId?: string | null;
  readonly resourceName?: string | null;
  readonly success: boolean;
  readonly reason?: string;
  /** Raw, UNREDACTED. Expected to already be a flat display snapshot (see AuditSnapshot), not a full domain object — the service redacts, it does not restructure. */
  readonly before?: Record<string, unknown>;
  /** Raw, UNREDACTED. Same shape expectation as `before`. */
  readonly after?: Record<string, unknown>;
  /** Raw, UNREDACTED event-specific context (e.g. { fromRole, toRole }). */
  readonly metadata?: Record<string, unknown>;
  /** Explicit override. Falls back to getRequestMetadata() when omitted — only works inside an actual request scope; recordSystemEvent/recordMany callers outside one should pass this explicitly or accept nulls. */
  readonly context?: Partial<AuditRequestContext>;
}

// ----------------------------------------------------------------------------
// Redaction helpers
// ----------------------------------------------------------------------------

/**
 * redact() returns `unknown` — it has no concept of the AuditMetadata
 * brand. Branding happens here, once, immediately after redaction, so
 * "this value passed through redact()" and "this value type-checks as
 * AuditMetadata" become the same fact rather than two things that could
 * drift apart.
 */
function toRedactedMetadata(
  raw: Record<string, unknown> | undefined,
): AuditMetadata | undefined {
  if (!raw) return undefined;
  const redacted = redact(raw) as Record<string, unknown>;
  return { ...redacted, __redacted: true } as AuditMetadata;
}

/**
 * Unlike AuditMetadata, AuditSnapshot carries no brand in audit.types.ts
 * — just redact-and-cast. Trusts the caller's contract that before/after
 * are already flat primitive maps (a display snapshot), not arbitrary
 * nested domain objects; redact() will still deep-walk whatever it's
 * given, but AuditSnapshot's own type is what enforces flatness upstream.
 */
function toRedactedSnapshot(
  raw: Record<string, unknown> | undefined,
): AuditSnapshot | undefined {
  if (!raw) return undefined;
  return redact(raw) as AuditSnapshot;
}

function toJsonInput<T>(
  value: T | null | undefined,
): Prisma.InputJsonValue | null {
  if (value === null || value === undefined) return null;
  return value as unknown as Prisma.InputJsonValue;
}

// ----------------------------------------------------------------------------
// Request context resolution
// ----------------------------------------------------------------------------

/**
 * Resolves ipAddress/userAgent via getRequestMetadata() when not
 * explicitly overridden. Wrapped defensively: getRequestMetadata() calls
 * next/headers(), which throws outside an actual request scope (e.g. a
 * cron job calling recordSystemEvent()) — a context-resolution failure
 * must degrade to nulls, never block the write it's describing.
 * requestId/sessionId always resolve to null for now — not yet
 * propagated end-to-end anywhere in the app (see AuditRequestContext's
 * own doc comment); this is expected, not a bug in this function.
 */
async function resolveRequestContext(
  override?: Partial<AuditRequestContext>,
): Promise<AuditRequestContext> {
  let ipAddress: string | null = null;
  let userAgent: string | null = null;

  try {
    const metadata = await getRequestMetadata();
    ipAddress = metadata.ipAddress ?? null;
    userAgent = metadata.userAgent ?? null;
  } catch {
    // No request scope available (background job, cron). Not an error
    // worth logging — this is an expected path for recordSystemEvent().
  }

  return {
    ipAddress: override?.ipAddress ?? ipAddress,
    userAgent: override?.userAgent ?? userAgent,
    requestId: override?.requestId ?? null,
    sessionId: override?.sessionId ?? null,
  };
}

// ----------------------------------------------------------------------------
// Assembly — public input → internal AuditRecordInput → repository row
// ----------------------------------------------------------------------------

/**
 * Soft integrity checks shared by every write path — see
 * AuditEventDefinition's own doc comments for why these warn rather
 * than throw (losing an audit record over a developer's missing
 * metadata key would be a worse outcome than writing an incomplete
 * one). Factored out so record() and recordMany() run the exact same
 * checks — recordMany's previous inline copy omitted both of these
 * entirely, so a batched write could violate either with no log
 * signal at all.
 */
function validateActorAndMetadata(
  eventKey: AuditEventKey,
  actor: AuditActor,
  metadata: Record<string, unknown> | undefined,
): void {
  const definition = getAuditEventDefinition(eventKey);

  if (
    definition.expectedActorTypes &&
    !definition.expectedActorTypes.includes(actor.actorType)
  ) {
    log.warn(`Audit event "${eventKey}" recorded with unexpected actor type`, {
      eventKey,
      actorType: actor.actorType,
      expected: definition.expectedActorTypes,
    });
  }

  if (definition.requiredMetadataKeys?.length) {
    const missing = definition.requiredMetadataKeys.filter(
      (key) => !metadata || !(key in metadata),
    );
    if (missing.length > 0) {
      log.warn(`Audit event "${eventKey}" is missing required metadata keys`, {
        eventKey,
        missing,
      });
    }
  }
}

/**
 * Resolves category/severity/resourceType from AUDIT_EVENTS, runs the
 * shared soft integrity checks, and assembles the internal
 * AuditRecordInput shape. Both record() and recordMany() go through
 * this now — the only behavioral difference between them is context
 * resolution: record() wants resolveRequestContext()'s
 * getRequestMetadata() fallback (a real request is live); recordMany()
 * does not (batched events may flush long after the originating
 * request is gone — see resolveContextFromRequest below).
 */
async function assembleAuditRecordInput(
  input: RecordAuditEventInput,
  options: { readonly resolveContextFromRequest?: boolean } = {},
): Promise<AuditRecordInput> {
  const definition = getAuditEventDefinition(input.eventKey);

  validateActorAndMetadata(input.eventKey, input.actor, input.metadata);

  const before = toRedactedSnapshot(input.before);
  const after = toRedactedSnapshot(input.after);

  const context =
    options.resolveContextFromRequest === false
      ? {
          ipAddress: input.context?.ipAddress ?? null,
          userAgent: input.context?.userAgent ?? null,
          requestId: input.context?.requestId ?? null,
          sessionId: input.context?.sessionId ?? null,
        }
      : await resolveRequestContext(input.context);

  return {
    eventKey: input.eventKey,
    actor: input.actor,
    resource: {
      resourceType: definition.resourceType,
      resourceId: input.resourceId ?? null,
      resourceName: input.resourceName ?? null,
    },
    context,
    success: input.success,
    reason: input.reason,
    diff: before && after ? { before, after } : undefined,
    metadata: toRedactedMetadata(input.metadata),
  };
}

/**
 * Flattens the assembled AuditRecordInput into the exact column shape
 * audit.repository.ts's create()/createMany() expect. See the module
 * header's "SHAPE BRIDGING NOTE" for why this conversion exists at all.
 */
function toCreateAuditLogInput(record: AuditRecordInput): CreateAuditLogInput {
  const definition = getAuditEventDefinition(record.eventKey as AuditEventKey);

  return {
    actorType: record.actor.actorType,
    actorId: record.actor.actorId,
    actorUsername: record.actor.actorUsername,
    actorRole: record.actor.actorRole,
    action: definition.action,
    success: record.success,
    reason: record.reason ?? null,
    resourceType: record.resource.resourceType,
    resourceId: record.resource.resourceId,
    resourceName: record.resource.resourceName,
    ipAddress: record.context.ipAddress,
    userAgent: record.context.userAgent,
    requestId: record.context.requestId,
    sessionId: record.context.sessionId,
    before: toJsonInput(record.diff?.before),
    after: toJsonInput(record.diff?.after),
    metadata: toJsonInput(record.metadata),
  };
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

/**
 * Records a single audit event. The one method the rest of the app
 * should reach for by default.
 *
 * Never throws. An audit write is important, but per this project's
 * explicit priority, gameplay must never fail because audit logging
 * did — a caught failure here is logged and swallowed, and the request
 * that triggered it continues normally.
 */
export async function record(
  db: DbClient,
  input: RecordAuditEventInput,
): Promise<{ id: string } | null> {
  try {
    const assembled = await assembleAuditRecordInput(input);
    const row = toCreateAuditLogInput(assembled);
    return await create(db, row);
  } catch (error) {
    log.error("Failed to record audit event", error, {
      eventKey: input.eventKey,
    });
    return null;
  }
}

/**
 * Batched variant backing a future write-buffer flush. Deliberately
 * does NOT implement AUDIT_PERFORMANCE's buffering, retry, or
 * dead-letter behavior itself — that belongs to whatever periodically
 * calls this. This method's only job is "take N already-decided
 * events, write them in one round-trip."
 *
 * Reuses assembleAuditRecordInput per item (with
 * resolveContextFromRequest: false — see that function's doc comment)
 * so batched writes get exactly the same actor/metadata validation as
 * a single record() call, instead of a hand-maintained second copy of
 * that logic silently drifting from it.
 */
export async function recordMany(
  db: DbClient,
  inputs: readonly RecordAuditEventInput[],
): Promise<{ count: number } | null> {
  try {
    const rows = await Promise.all(
      inputs.map(async (input) => {
        const assembled = await assembleAuditRecordInput(input, {
          resolveContextFromRequest: false,
        });
        return toCreateAuditLogInput(assembled);
      }),
    );

    return await createMany(db, rows);
  } catch (error) {
    log.error("Failed to record batched audit events", error, {
      count: inputs.length,
    });
    return null;
  }
}

/**
 * Convenience wrapper for system/background-initiated events (scheduled
 * jobs, automated security detections). Pins a SYSTEM actor so call
 * sites like the brute-force lockout job or refresh-token-reuse
 * detection don't each hand-assemble the same null-actor object.
 */
export async function recordSystemEvent(
  db: DbClient,
  eventKey: AuditEventKey,
  options: Omit<RecordAuditEventInput, "actor" | "eventKey"> = {
    success: true,
  },
): Promise<{ id: string } | null> {
  const actor: AuditActor = {
    actorType: AuditActorType.SYSTEM,
    actorId: null,
    actorUsername: null,
    actorRole: null,
  };

  return record(db, { eventKey, actor, ...options });
}

/**
 * Convenience wrapper for failure events. Makes `reason` a required
 * parameter rather than an optional field on RecordAuditEventInput a
 * call site could forget — the one place a missing explanation is most
 * likely to be a real bug, not a stylistic omission.
 */
export async function recordFailure(
  db: DbClient,
  eventKey: AuditEventKey,
  actor: AuditActor,
  reason: string,
  options: Omit<
    RecordAuditEventInput,
    "actor" | "eventKey" | "success" | "reason"
  > = {},
): Promise<{ id: string } | null> {
  return record(db, { eventKey, actor, success: false, reason, ...options });
}
