import type { DbClient } from "@/lib/prisma";
import { eventRepository } from "../repositories/event.repository";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import { getCountDown } from "../utils/countdown";
import { getEventAccess } from "../utils/get-event-access";
import type { EventAccess, EventCountdown } from "../types/event.types";
import { eventLogger as log } from "@/lib/logger/logger.scopes";

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
    return getEventAccess(event);
  }

  async getCountdown(db: DbClient): Promise<EventCountdown> {
    const event = await this.getEvent(db);
    const access = getEventAccess(event);

    if (!access.hasStarted) return getCountDown(event.startsAt);
    if (!access.hasEnded) return getCountDown(event.endsAt);

    return getCountDown(new Date());
  }
}

export const eventService = new EventService();
