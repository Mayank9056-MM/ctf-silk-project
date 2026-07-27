// lib/get-request-metadata.ts
import { headers } from "next/headers";

export interface RequestMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export async function getRequestMetadata(): Promise<RequestMetadata> {
  const headersList = await headers();

  const forwardedFor = headersList.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? undefined;

  return {
    userAgent: headersList.get("user-agent") ?? undefined,
    ipAddress,
  };
}