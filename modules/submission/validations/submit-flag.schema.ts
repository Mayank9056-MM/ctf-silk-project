import { z } from "zod";
import { normalizeFlag } from "../utils/normalize-flag";

const FLAG_PATTERN = /^CTF\{[a-z0-9_]+\}$/;
const MAX_FLAG_LENGTH = 255;

export const submitFlagSchema = z.object({
  challengeId: z.cuid2("Invalid challenge ID.").trim(),

  flag: z
    .string()
    // Length-cap on the raw input first — cheap check, runs before any
    // regex work touches a potentially huge string.
    .max(MAX_FLAG_LENGTH, "Flag is too long.")
    .transform(normalizeFlag)
    .pipe(
      z
        .string()
        .min(1, "Flag is required.")
        .regex(
          FLAG_PATTERN,
          "Invalid flag format. Expected: ctf{example_flag}",
        ),
    ),
});

export type SubmitFlagInput = z.infer<typeof submitFlagSchema>;
