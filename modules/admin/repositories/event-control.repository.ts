import type { EventControl } from "@/app/generated/prisma/client";
import { EventOperationalMode } from "@/app/generated/prisma/enums";
import type { DbClient } from "@/lib/prisma";

/**
 * Pure EventControl persistence.
 *
 * EventControl rows are expected to exist before mutation operations are
 * called. Missing rows therefore propagate Prisma's P2025 error to the
 * service layer for translation.
 *
 * All operations are scoped by the unique eventId.
 */
export class EventControlRepository {
  async getEventControl(
    db: DbClient,
    eventId: string,
  ): Promise<EventControl | null> {
    return db.eventControl.findUnique({
      where: { eventId },
    });
  }

  async pauseEvent(
    db: DbClient,
    eventId: string,
    data: {
      pausedAt: Date;
      pauseReason: string;
      pausedById: string;
    },
  ): Promise<EventControl> {
    return db.eventControl.update({
      where: { eventId },
      data: {
        mode: EventOperationalMode.PAUSED,
        pausedAt: data.pausedAt,
        pauseReason: data.pauseReason,
        pausedById: data.pausedById,
      },
    });
  }

  async resumeEvent(db: DbClient, eventId: string): Promise<EventControl> {
    return db.eventControl.update({
      where: { eventId },
      data: {
        mode: EventOperationalMode.NORMAL,
        pausedAt: null,
        pauseReason: null,
        pausedById: null,
      },
    });
  }

  async enableRegistration(
    db: DbClient,
    eventId: string,
  ): Promise<EventControl> {
    return db.eventControl.update({
      where: { eventId },
      data: {
        registrationEnabled: true,
      },
    });
  }

  async disableRegistration(
    db: DbClient,
    eventId: string,
  ): Promise<EventControl> {
    return db.eventControl.update({
      where: { eventId },
      data: {
        registrationEnabled: false,
      },
    });
  }
}

export const eventControlRepository = new EventControlRepository();
