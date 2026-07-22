import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  APP_URL: z.url().default("http://localhost:3000"),

  // Database
  DATABASE_URL: z.string().min(1),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),

  // Argon
  ARGON2_MEMORY_COST: z.coerce
    .number()
    .min(2 ** 16)
    .max(1024 * 1024) // 1 GiB
    .default(65536),
  ARGON2_TIME_COST: z.coerce.number().min(1).max(10).default(3),
  ARGON2_PARALLELISM: z.coerce.number().min(1).max(32).default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:\n");

  console.error(parsed.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = parsed.data;
