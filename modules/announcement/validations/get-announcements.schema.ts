// get-announcement.schema.ts

import { z } from "zod";
import { ANNOUNCEMENT_PAGINATION } from "../constants/announcement.constants";

export const getAnnouncementsSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive("Page must be greater than zero.")
    .default(1),

  pageSize: z.coerce
    .number()
    .int()
    .positive("Page size must be greater than zero.")
    .max(
      ANNOUNCEMENT_PAGINATION.MAX_PAGE_SIZE,
      `Page size cannot exceed ${ANNOUNCEMENT_PAGINATION.DEFAULT_PAGE_SIZE}`,
    )
    .default(ANNOUNCEMENT_PAGINATION.DEFAULT_PAGE_SIZE),
});

export type GetAnnouncementsSchema = z.infer<typeof getAnnouncementsSchema>;
