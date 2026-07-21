import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email("Invalid email address.")
    .trim()
    .toLowerCase()
    .max(255, "Email cannot exceed 255 characters."),
  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password cannot exceed 128 characters."),
});

export type LoginInput = z.infer<typeof loginSchema>;

