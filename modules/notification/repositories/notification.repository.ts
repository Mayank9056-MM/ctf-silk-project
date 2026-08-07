import type { Notification, Prisma } from "@/app/generated/prisma/client";
import type { DbClient } from "@/lib/prisma";

import type {
  CreateNotificationInput,
  NotificationListQuery,
  NotificationListResult,
} from "../types/notification.types";

// notification.repository.ts

class NotificationRepository {
  /**
   * Persists one notification row. Takes CreateNotificationInput exactly
   * as assembled by the service — no validation, no permission check, no
   * decision about whether this notification SHOULD be sent. By the time
   * this method is called, that decision has already been made.
   *
   * `resourceType`/`resourceId` are passed through as-is; both are
   * optional on the input and nullable on the schema, so a purely
   * informational notification (nothing to navigate to) is expressed by
   * simply omitting them; Prisma treats an undefined field as "use the
   * column default / leave it null," never coercing it to an empty
   * string.
   */
  async createNotification(
    db: DbClient,
    input: CreateNotificationInput,
  ): Promise<Notification> {
    return db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        priority: input.priority,
        title: input.title,
        message: input.message,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
      },
    });
  }

  /**
   * A single notification by id — no ownership filter, no join. Whether
   * the caller is actually allowed to see this row is
   * notification.service.ts's decision, made after this method returns;
   * baking a userId check into this query would mean the repository is
   * silently enforcing an authorization rule the service is supposed to
   * own, and a service that forgot to check ownership itself would have
   * no way to tell "not found" apart from "found, but not yours" — two
   * outcomes with very different response codes at the action layer.
   */
  async findNotificationById(
    db: DbClient,
    notificationId: string,
  ): Promise<Notification | null> {
    return db.notification.findUnique({
      where: { id: notificationId },
    });
  }

  /**
   * One user's own notifications, newest first, paginated.
   *
   * WHY $transaction, NOT Promise.all
   * Announcement's list read uses db.$transaction for the identical
   * reason this one does, and the reasoning is if anything stronger
   * here: Promise.all runs two independent queries concurrently with no
   * guarantee they observe the same database snapshot — under
   * PostgreSQL's default READ COMMITTED isolation, a row committed
   * between the two calls is visible to whichever query runs second but
   * not the one that already ran. For Announcement, that risk is a
   * cosmetic "total count off by one for a moment." For Notification,
   * it's a live, self-inflicted correctness bug: a notification created
   * (say, by a submission or leaderboard event) in the gap between the
   * findMany and the count would either inflate `total` beyond what
   * `notifications` reflects, or — worse — cause `totalPages` at the
   * mapper layer to imply a page of results the findMany call never
   * actually returned. Wrapping both queries in db.$transaction gives
   * them one consistent snapshot, so the rows and the count always
   * describe the exact same moment in time.
   */
  async findNotifications(
    db: DbClient,
    userId: string,
    query: NotificationListQuery,
  ): Promise<NotificationListResult> {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const [notifications, total] = await db.$transaction([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.notification.count({
        where: { userId },
      }),
    ]);

    return { notifications, total };
  }

  /**
   * The unread badge count for one user — deliberately its own method
   * rather than derived from findNotifications' result. A badge count is
   * requested far more often than a full list is opened (every page
   * load, every poll interval), and it needs none of findNotifications'
   * pagination or row payload — a single COUNT query with no findMany
   * alongside it is the entire cost this call site should ever pay.
   */
  async countUnreadNotifications(
    db: DbClient,
    userId: string,
  ): Promise<number> {
    return db.notification.count({
      where: { userId, readAt: null },
    });
  }

  /**
   * Marks exactly one notification read by setting `readAt` to now.
   *
   * Uses `update()`, not `updateMany()` — deliberately. `update()`
   * throws Prisma's P2025 ("Record to update not found") if
   * `notificationId` doesn't exist, which propagates as a real error the
   * service must handle explicitly. `updateMany()` would instead report
   * `{ count: 0 }` on a missing row — a silent no-op indistinguishable
   * from "updated a row that just happened to already be read." For a
   * single, addressed record, "the id you gave me doesn't exist" is
   * information the caller needs, not a condition to swallow.
   *
   * No ownership check, same reasoning as findNotificationById — this
   * method only knows "mark this id read," never "is this the right
   * user's notification." The service must confirm ownership (typically
   * via a preceding findNotificationById) before ever calling this.
   */
  async markNotificationAsRead(
    db: DbClient,
    notificationId: string,
  ): Promise<Notification> {
    return db.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  /**
   * Marks every currently-unread notification belonging to one user as
   * read, in a single statement.
   *
   * Uses `updateMany()`, not a loop of individual `update()` calls — a
   * loop would mean N round trips to the database for N unread
   * notifications, each one paying its own network and query-planning
   * cost, when the entire operation is expressible as one UPDATE ...
   * WHERE statement. `updateMany()` is also naturally idempotent here:
   * the `readAt: null` filter means re-running this against a user with
   * zero unread notifications safely returns `{ count: 0 }` rather than
   * erroring, unlike the single-row `update()` above where a missing
   * target is treated as an error condition — the two methods have
   * different failure semantics on purpose, because "no unread
   * notifications to mark" is a completely ordinary, expected outcome
   * for a bulk operation, whereas "the specific id you asked for doesn't
   * exist" is not.
   *
   * Returns Prisma's own BatchPayload type directly rather than a
   * custom-shaped result — `{ count: number }` is already the complete,
   * correct answer to "how many rows changed," and wrapping it in a
   * bespoke type here would just be indirection with no added meaning.
   */
  async markAllNotificationsAsRead(
    db: DbClient,
    userId: string,
  ): Promise<Prisma.BatchPayload> {
    return db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}

export const notificationRepository = new NotificationRepository();
