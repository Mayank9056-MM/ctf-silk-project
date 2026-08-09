import type { EventControl } from "@/app/generated/prisma/client";
import { EventOperationalMode } from "@/app/generated/prisma/enums";
import type { DbClient } from "@/lib/prisma";

/**
 * Pure EventControl persistence.
 *
 * getEventControl is a plain read — used both standalone (getEventControl
 * service method) and as the existence pre-check inside every mutation.
 *
 * pauseEvent/resumeEvent/enableRegistration/disableRegistration are each
 * a single conditional updateMany, scoped by eventId AND the expected
 * current state. That WHERE clause — not a preceding read — is what
 * makes the transition atomic: if a concurrent request already changed
 * the row's state, this update matches zero rows instead of blindly
 * overwriting. Each method returns whether the transition actually
 * applied; the service layer decides what a false result means for that
 * particular operation (a rejection, or a legitimate no-op).
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
      pauseReason: string | null;
      pausedById: string;
    },
  ): Promise<boolean> {
    const result = await db.eventControl.updateMany({
      where: { eventId, mode: EventOperationalMode.NORMAL },
      data: {
        mode: EventOperationalMode.PAUSED,
        pausedAt: data.pausedAt,
        pauseReason: data.pauseReason,
        pausedById: data.pausedById,
      },
    });
    return result.count === 1;
  }

  async resumeEvent(db: DbClient, eventId: string): Promise<boolean> {
    const result = await db.eventControl.updateMany({
      where: { eventId, mode: EventOperationalMode.PAUSED },
      data: {
        mode: EventOperationalMode.NORMAL,
        pausedAt: null,
        pauseReason: null,
        pausedById: null,
      },
    });
    return result.count === 1;
  }

  async enableRegistration(db: DbClient, eventId: string): Promise<boolean> {
    const result = await db.eventControl.updateMany({
      where: { eventId, registrationEnabled: false },
      data: { registrationEnabled: true },
    });
    return result.count === 1;
  }

  async disableRegistration(db: DbClient, eventId: string): Promise<boolean> {
    const result = await db.eventControl.updateMany({
      where: { eventId, registrationEnabled: true },
      data: { registrationEnabled: false },
    });
    return result.count === 1;
  }
}

export const eventControlRepository = new EventControlRepository();
