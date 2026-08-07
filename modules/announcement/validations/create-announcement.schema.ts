// create-announcement.schema.ts

import { z } from "zod";
import { AnnouncementPriority } from "@/app/generated/prisma/enums";
import { ANNOUNCEMENT_LIMITS } from "../constants/announcement.constants";

export const createAnnouncementSchema = z.object({
  /**
   * The announcement's headline. Trimmed before length is checked, so a
   * whitespace-only submission is rejected as empty rather than
   * accepted as a title full of invisible characters.
   */
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(
      ANNOUNCEMENT_LIMITS.TITLE_MAX_LENGTH,
      `Title must not exceed ${ANNOUNCEMENT_LIMITS.TITLE_MAX_LENGTH} characters.`,
    ),

  /**
   * The announcement's body. Same trim-then-check treatment as title —
   * a message of only spaces or newlines is not a meaningful
   * announcement and is rejected the same way an empty one would be.
   */
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(
      ANNOUNCEMENT_LIMITS.MESSAGE_MAX_LENGTH,
      `Message must not exceed ${ANNOUNCEMENT_LIMITS.MESSAGE_MAX_LENGTH} characters.`,
    ),

  /**
   * Must be one of the real AnnouncementPriority enum values
   * (NORMAL / IMPORTANT / CRITICAL) as defined in schema.prisma —
   * validated against the actual Prisma enum, not a hand-maintained
   * string union that could drift from it after a future schema change.
   */
  priority: z.enum(AnnouncementPriority, {
    error: () => ({ message: "Please select a valid priority level." }),
  }),
});

/**
 * The validated, trimmed shape a Server Action passes into
 * announcementService.createAnnouncement() as its `input` argument
 * (alongside the actor, resolved separately — see this schema's own
 * module header). Structurally compatible with
 * `Omit<CreateAnnouncementInput, "createdById">`, since every field
 * validated here is exactly the set that type expects from a client.
 */
export type CreateAnnouncementSchema = z.infer<typeof createAnnouncementSchema>;
