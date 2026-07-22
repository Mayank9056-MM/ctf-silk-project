import { headers } from "next/headers";

export interface RequestMetadata {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Best-effort client identification for the RefreshToken audit columns.
 * `x-forwarded-for` can be a comma-separated chain when the request passes
 * through multiple proxies — the first entry is the original client.
 */
export async function getRequestMetadata(): Promise<RequestMetadata> {
  const headersList = await headers();

  const forwardedFor = headersList.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    undefined;

  return {
    userAgent: headersList.get("user-agent") ?? undefined,
    ipAddress,
  };
}