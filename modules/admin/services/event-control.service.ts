import type { Event, EventControl } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import type { DbClient } from "@/lib/prisma";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import { eventLogger as log } from "@/lib/logger/logger.scopes";

import { record } from "@/modules/audit/services/audit.service";
import type { AuditActor } from "@/modules/audit/types/audit.types";
import { eventService } from "@/modules/event/services/event.service";

import { assertCanManageEventControl } from "../utils/event-control-access";
import { eventControlRepository } from "../repositories/event-control.repository";
import { toEventControlDTO } from "../utils/event-control.mapper";
import type { EventControlDTO } from "../types/event-control.dto";

/**
 * Orchestration for the platform's EventControl: pause/resume gameplay
 * and enable/disable registration. Authorization, Event resolution,
 * state-transition rules, transactions, and audit recording live here.
 * Every actual query is event-control.repository.ts's; every DTO shape
 * is event-control.mapper.ts's.
 *
 * WHY EVENTCONTROL READS ARE ALSO AUTHORIZED — unlike Announcement's
 * public/admin DTO split, there is no player-facing use for EventControl
 * state anywhere in this module's scope; pausedById/pauseReason are
 * internal operational detail. getEventControl() requires the same
 * assertCanManageEventControl() every mutation does — a judgment call
 * given no separate read-permission concept exists in this
 * architecture, not an inherited certainty.
 *
 * PAUSE/RESUME VS. REGISTRATION — two different idempotency shapes,
 * both drawn from precedent already in this codebase. Pause/resume
 * mirror announcement.service.ts's archiveAnnouncement: a redundant
 * attempt is a real, meaningful rejection (ApiError.conflict), not a
 * silent no-op. Registration enable/disable mirror leaderboard.service.ts's
 * freeze/unfreeze no-op handling instead: re-submitting the same state
 * skips the write AND the audit entirely.
 *
 * ATOMICITY — every mutation's read and state check happen inside the
 * same transaction as its write, and the write itself is scoped by the
 * expected current state (see event-control.repository.ts). A stale
 * read can no longer cause a duplicate transition; see each method
 * below for how a rejected/no-op write is interpreted.
 */
class EventControlService {
  /**
   * Current EventControl state. Read-only, no transaction, no audit —
   * matches every other module's own "no audit on GET" convention.
   */
  async getEventControl(actor: AuditActor): Promise<EventControlDTO> {
    const event = await this.authorizeAndResolveEvent(actor);
    const control = await this.requireEventControl(prisma, event.id);
    return toEventControlDTO(control);
  }

  /**
   * Pauses the event. The conditional update inside the transaction is
   * the actual atomicity guarantee — a `false` result means the row
   * was no longer NORMAL by the time the write executed, whether
   * because it was already PAUSED or a concurrent duplicate request won
   * the race, and both cases get the same conflict response.
   */
  async pauseEvent(
    actor: AuditActor,
    reason: string,
  ): Promise<EventControlDTO> {
    const event = await this.authorizeAndResolveEvent(actor);

    if (!actor.actorId) {
      throw ApiError.forbidden(
        ErrorCode.FORBIDDEN,
        "A resolvable actor is required to pause the event.",
      );
    }
    const actorId = actor.actorId;

    let updated: EventControl;

    try {
      updated = await prisma.$transaction(async (tx) => {
        await this.requireEventControl(tx, event.id);

        const applied = await eventControlRepository.pauseEvent(tx, event.id, {
          pausedAt: new Date(),
          pauseReason: reason,
          pausedById: actorId,
        });

        if (!applied) {
          throw ApiError.conflict(
            ErrorCode.VALIDATION_ERROR,
            "The event is already paused.",
          );
        }

        await record(tx, {
          eventKey: "EVENT_PAUSED",
          actor,
          resourceId: event.id,
          resourceName: event.title,
          success: true,
          reason: reason ?? undefined,
        });

        return this.requireEventControl(tx, event.id);
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      log.error("Unexpected error pausing event", error, {
        actorId,
        eventId: event.id,
        operation: "pauseEvent",
      });
      throw error;
    }

    log.info("Event paused", { actorId, eventId: event.id });

    return toEventControlDTO(updated);
  }

  /**
   * Resumes the event. Symmetric to pauseEvent — a `false` result from
   * the conditional update means the row was no longer PAUSED by the
   * time the write executed.
   */
  async resumeEvent(actor: AuditActor): Promise<EventControlDTO> {
    const event = await this.authorizeAndResolveEvent(actor);

    let updated: EventControl;

    try {
      updated = await prisma.$transaction(async (tx) => {
        await this.requireEventControl(tx, event.id);

        const applied = await eventControlRepository.resumeEvent(tx, event.id);

        if (!applied) {
          throw ApiError.conflict(
            ErrorCode.VALIDATION_ERROR,
            "The event is not currently paused.",
          );
        }

        await record(tx, {
          eventKey: "EVENT_RESUMED",
          actor,
          resourceId: event.id,
          resourceName: event.title,
          success: true,
        });

        return this.requireEventControl(tx, event.id);
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      log.error("Unexpected error resuming event", error, {
        actorId: actor.actorId,
        eventId: event.id,
        operation: "resumeEvent",
      });
      throw error;
    }

    log.info("Event resumed", { actorId: actor.actorId, eventId: event.id });

    return toEventControlDTO(updated);
  }

  /** Enables registration. See setRegistration for the shared no-op handling. */
  async enableRegistration(actor: AuditActor): Promise<EventControlDTO> {
    return this.setRegistration(actor, true);
  }

  /** Disables registration. Same handling as enableRegistration. */
  async disableRegistration(actor: AuditActor): Promise<EventControlDTO> {
    return this.setRegistration(actor, false);
  }

  // --------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------

  private async authorizeAndResolveEvent(actor: AuditActor): Promise<Event> {
    assertCanManageEventControl(actor);
    return eventService.getEvent(prisma);
  }

  /**
   * The existence pre-check shared by every method — a fast, specific
   * NOT_FOUND for the "not initialized yet" case. Called with `prisma`
   * for the plain read (getEventControl) and with `tx` inside every
   * mutation, so the read genuinely happens inside the same transaction
   * as the write that follows it.
   */
  private async requireEventControl(
    db: DbClient,
    eventId: string,
  ): Promise<EventControl> {
    const control = await eventControlRepository.getEventControl(db, eventId);

    if (!control) {
      throw ApiError.notFound(
        ErrorCode.NOT_FOUND,
        "Event control state has not been initialized.",
      );
    }

    return control;
  }

  /**
   * Shared by enableRegistration/disableRegistration. Two layers of
   * no-op detection, both correct for what they catch: the pre-read
   * check below skips the write entirely for the common "already in
   * that state" case; the conditional update's own `false` result
   * catches the rarer case where a concurrent request already made the
   * same change between that read and this write. Either way: no
   * write, no audit, just the current state returned.
   */
  private async setRegistration(
    actor: AuditActor,
    enabled: boolean,
  ): Promise<EventControlDTO> {
    const event = await this.authorizeAndResolveEvent(actor);

    let updated: EventControl;

    try {
      updated = await prisma.$transaction(async (tx) => {
        const current = await this.requireEventControl(tx, event.id);

        if (current.registrationEnabled === enabled) {
          return current;
        }

        const applied = enabled
          ? await eventControlRepository.enableRegistration(tx, event.id)
          : await eventControlRepository.disableRegistration(tx, event.id);

        if (!applied) {
          return this.requireEventControl(tx, event.id);
        }

        await record(tx, {
          eventKey: enabled ? "REGISTRATION_ENABLED" : "REGISTRATION_DISABLED",
          actor,
          resourceId: event.id,
          resourceName: event.title,
          success: true,
        });

        return this.requireEventControl(tx, event.id);
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      log.error("Unexpected error changing registration state", error, {
        actorId: actor.actorId,
        eventId: event.id,
        operation: enabled ? "enableRegistration" : "disableRegistration",
      });
      throw error;
    }

    log.info("Registration state changed", {
      actorId: actor.actorId,
      eventId: event.id,
      enabled,
    });

    return toEventControlDTO(updated);
  }
}

export const eventControlService = new EventControlService();