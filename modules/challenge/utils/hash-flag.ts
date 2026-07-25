// modules/challenge/utils/hash-flag.ts
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/config/env";

export function hashFlag(flag: string): string {
  return createHmac("sha256", env.FLAG_HASH_SECRET)
    .update(flag.trim())
    .digest("hex");
}

export function compareFlag(submittedFlag: string, flagHash: string): boolean {
  const submittedHash = hashFlag(submittedFlag);
  return timingSafeEqual(Buffer.from(submittedHash), Buffer.from(flagHash));
}
