import type { Prisma, Event } from "@/app/generated/prisma/client";
import type { DbClient } from "@/lib/prisma";

export class EventRepository {
  async findSingleton(db: DbClient): Promise<Event | null> {
    return db.event.findUnique({ where: { singleton: 1 } });
  }

  async create(db: DbClient, data: Prisma.EventCreateInput): Promise<Event> {
    return db.event.create({ data });
  }

  async update(db: DbClient, data: Prisma.EventUpdateInput): Promise<Event> {
    return db.event.update({ where: { singleton: 1 }, data });
  }

  async exists(db: DbClient): Promise<boolean> {
    const event = await db.event.findUnique({
      where: { singleton: 1 },
      select: { id: true },
    });
    return event != null;
  }
}

export const eventRepository = new EventRepository();
