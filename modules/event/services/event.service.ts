import type { DbClient } from "@/lib/prisma";
import { eventRepository } from "../repositories/event.repository";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import { getCountDown } from "../utils/countdown";
import { getEventAccess } from "../utils/get-event-access";
import type { EventAccess, EventCountdown } from "../types/event.types";
import { eventLogger as log } from "@/lib/logger/logger.scopes";
import { eventControlRepository } from "@/modules/admin/repositories/event-control.repository";
import { Event } from "@/app/generated/prisma/client";

export class EventService {
  async getEvent(db: DbClient) {
    const event = await eventRepository.findSingleton(db);

    if (!event) {
      log.error(
        "Event singleton is missing — every gated action on the platform will fail until this is seeded",
      );

      throw ApiError.notFound(
        ErrorCode.NOT_FOUND,
        "Event has not been initialized.",
      );
    }

    return event;
  }

  async getEventAccess(db: DbClient): Promise<EventAccess> {
    const event = await this.getEvent(db);
    const control = await eventControlRepository.getEventControl(db, event.id);

    if (!control) {
      log.error(
        "EventControl is missing for the current event — every gated action on the platform will fail until this is seeded",
        undefined,
        { eventId: event.id },
      );

      throw ApiError.notFound(
        ErrorCode.NOT_FOUND,
        "Event control has not been initialized.",
      );
    }

    return getEventAccess(event, control);
  }

  async getCountdown(db: DbClient): Promise<EventCountdown> {
    const event = await this.getEvent(db);
    const control = await eventControlRepository.getEventControl(db, event.id);

    if (!control) {
      log.error(
        "EventControl is missing for the current event — countdown cannot be computed",
        undefined,
        { eventId: event.id },
      );
      throw ApiError.notFound(
        ErrorCode.NOT_FOUND,
        "Event control has not been initialized.",
      );
    }

    const access = getEventAccess(event, control);

    if (!access.hasStarted) return getCountDown(event.startsAt);
    if (!access.hasEnded) return getCountDown(event.endsAt);

    return getCountDown(new Date());
  }

  /**
   * Composes Event + EventControl + derived access/countdown in a single
   * pass. Added specifically for DashboardService, which needs all
   * three and would otherwise trigger getEvent()/getEventControl() three
   * separate times (once via getEvent(), once via getEventAccess(),
   * once via getCountdown(), each independently re-fetching the same
   * two rows). Existing callers of getEvent/getEventAccess/getCountdown
   * are completely untouched — this is a new, additive method, not a
   * replacement.
   */
  async getEventSummary(db: DbClient): Promise<{
    event: Event;
    access: EventAccess;
    countdown: EventCountdown;
  }> {
    const event = await this.getEvent(db);
    const control = await this.requireEventControl(db, event.id);
    const access = getEventAccess(event, control);

    const countdown = !access.hasStarted
      ? getCountDown(event.startsAt)
      : !access.hasEnded
        ? getCountDown(event.endsAt)
        : getCountDown(new Date());

    return { event, access, countdown };
  }

  /**
   * Shared by getEventAccess/getCountdown/getEventSummary — extracted
   * only now that a third caller needed the identical "fetch
   * EventControl, throw NOT_FOUND if missing" block, avoiding a third
   * copy of the same five lines. Purely internal; no external behavior
   * change for any existing caller of the three public methods above.
   */
  private async requireEventControl(db: DbClient, eventId: string) {
    const control = await eventControlRepository.getEventControl(db, eventId);

    if (!control) {
      log.error(
        "EventControl is missing for the current event — every gated action on the platform will fail until this is seeded",
        undefined,
        { eventId },
      );
      throw ApiError.notFound(
        ErrorCode.NOT_FOUND,
        "Event control has not been initialized.",
      );
    }

    return control;
  }
}

export const eventService = new EventService();
