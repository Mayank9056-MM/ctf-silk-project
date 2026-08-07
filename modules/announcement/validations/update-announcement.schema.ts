// update-announcement.schema.ts

import { z } from "zod";
import {
  createAnnouncementSchema,
  CreateAnnouncementSchema,
} from "./create-announcement.schema";

export const updateAnnouncementSchema = createAnnouncementSchema
  .pick({
    title: true,
    message: true,
    priority: true,
  })
  .partial()
  .extend({
    id: z.string().trim().min(1, "Announcement ID is required."),
  })
  .superRefine((data, ctx) => {
    /**
     * Rejects a request that supplies id and nothing else. Checked here
     * — after per-field validation has already run — rather than as a
     * simple boolean AND at the object level, so this rule fires with
     * its own clear message instead of being masked by (or confused
     * with) a per-field error.
     */
    const hasEditableField =
      data.title !== undefined ||
      data.message !== undefined ||
      data.priority !== undefined;

    if (!hasEditableField) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field must be updated.",
        path: [],
      });
    }
  });

/**
 * The validated shape a Server Action passes into
 * announcementService.updateAnnouncement() as its `id` and `input`
 * arguments (id destructured out separately — see that method's
 * signature). Every content field here is optional by construction,
 * matching UpdateAnnouncementInput exactly; Prisma's update() already
 * omits `undefined` fields from the SQL UPDATE rather than nulling them,
 * so a partial submission here correctly becomes a partial write there.
 */
export type UpdateAnnouncementSchema = z.infer<typeof updateAnnouncementSchema>;
