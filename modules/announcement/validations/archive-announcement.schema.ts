import { z } from "zod";

export const archiveAnnouncementSchema = z.object({
  id: z.string().trim().min(1, "Announcement ID is required."),
});

export type ArchiveAnnouncementSchema = z.infer<
  typeof archiveAnnouncementSchema
>;
