import { createHmac } from "crypto";
import { env } from "@/config/env";

export function hashIdentifier(identifier: string): string {
  const normalized = identifier.trim().toLowerCase();
  return createHmac("sha256", env.RATE_LIMIT_HASH_SECRET)
    .update(normalized)
    .digest("hex");
}
