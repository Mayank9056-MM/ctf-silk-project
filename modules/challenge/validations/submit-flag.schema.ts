import { z } from "zod";

export const submitFlagSchema = z.object({
  challengeId: z.cuid2("Invalid challenge ID."),
  flag: z
    .string()
    .trim()
    .min(1, "Flag is required.")
    .max(255, "Flag is too long.")
    .regex(
      /^ctf\{[a-z0-9]+\}$/,
      "Flag must follow the format ctf{example_flag}.",
    ),
});

export type submitFlagInput = z.infer<typeof submitFlagSchema>;