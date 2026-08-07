// get-announcement.schema.ts

import { z } from "zod";

export const getAnnouncementSchema = z.object({
  id: z.string().trim().min(1, "Announcement ID is required."),
});

export type GetAnnouncementSchema = z.infer<typeof getAnnouncementSchema>;
