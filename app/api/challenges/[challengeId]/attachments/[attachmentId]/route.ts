// app/api/challenges/[challengeId]/attachments/[attachmentId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

import { Permission } from "@/modules/auth/authorization/permission";
import { requirePermission } from "@/modules/auth/authorization/require-role";
import { challengeAccessService } from "@/modules/challenge/services/challenge-access.service";
import { challengeRepository } from "@/modules/challenge/repositories/challenge.repository";
import { resolveChallengeAsset } from "@/lib/assets/challenge-assets";
import { challengeLogger as log } from "@/lib/logger/logger.scopes";

/**
 * The project root's private asset directory — NOT `public/`, and
 * therefore not statically served by Next.js. This is the only base
 * directory this route will ever read from; see the containment check
 * below for why that matters even though every path it's combined with
 * already passed resolveChallengeAsset()'s own validation.
 */
const ASSETS_ROOT = path.join(process.cwd(), "assets");

function notFound(): NextResponse {
  return NextResponse.json({ message: "Not found." }, { status: 404 });
}

/**
 * The authenticated attachment download path (Change 6 / this session's
 * Steps 5–7). Authorization is independently re-derived from
 * (userId, challengeId) via ChallengeAccessService on every single
 * request — never from the requesting page having successfully loaded
 * the challenge earlier, never from anything in the URL beyond the two
 * path params already present, and never from ChallengeAttachment.filePath
 * being treated as anything other than an opaque key into
 * challenge-assets.ts's allowlist. Every failure path (unauthenticated,
 * unauthorized challenge, attachment not found, unresolvable asset key,
 * unreadable file) returns the exact same generic 404 shape — a player
 * probing this endpoint learns nothing about which failure occurred.
 */
export async function GET(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ challengeId: string; attachmentId: string }> },
) {
  const { challengeId, attachmentId } = await params;

  let userId: string;
  try {
    const user = await requirePermission(Permission.VIEW_CHALLENGES);
    userId = user.userId;
  } catch {
    return notFound();
  }

  const access = await challengeAccessService.evaluateChallengeAccess(
    userId,
    challengeId,
  );

  if (!access.isAuthorized) {
    log.warn("Attachment download denied by ChallengeAccessService", {
      userId,
      challengeId,
      attachmentId,
      deniedReason: access.deniedReason,
    });
    return notFound();
  }

  // Scoped by BOTH ids — an attachment can never be fetched under the
  // wrong challenge, even if the id itself is a real attachment id
  // belonging to some other (possibly inaccessible) challenge.
  const attachment = await challengeRepository.findAttachmentForChallenge(
    challengeId,
    attachmentId,
  );

  if (!attachment) {
    log.warn(
      "Attachment download denied — attachment not found for challenge",
      { userId, challengeId, attachmentId },
    );
    return notFound();
  }

  // attachment.filePath is an ASSET KEY, never a literal filesystem path.
  // The request itself supplies no path information whatsoever — only
  // challengeId/attachmentId — so there is no client input anywhere in
  // this chain that could influence which file gets read.
  const relativePath = resolveChallengeAsset(attachment.filePath);
  if (!relativePath) {
    log.error(
      "Attachment references an unresolvable asset key — content-authoring gap or unfilled registry entry",
      undefined,
      { userId, challengeId, attachmentId, assetKey: attachment.filePath },
    );
    return notFound();
  }

  const absolutePath = path.join(ASSETS_ROOT, relativePath);

  // Defense in depth: resolveChallengeAsset() already rejected traversal/
  // absolute/scheme-prefixed values in the registry entry itself, but
  // re-confirm the FINAL resolved path still lands inside ASSETS_ROOT
  // before ever touching the filesystem. Belt-and-suspenders against any
  // future change to isSafeRelativePath that might miss a case.
  const normalizedRoot = path.normalize(ASSETS_ROOT + path.sep);
  const normalizedTarget = path.normalize(absolutePath);
  if (!normalizedTarget.startsWith(normalizedRoot)) {
    log.error(
      "Resolved asset path escaped the assets root — refusing to read",
      undefined,
      { userId, challengeId, attachmentId, assetKey: attachment.filePath },
    );
    return notFound();
  }

  let fileBuffer: Buffer;
  let fileSize: number;
  try {
    const fileStat = await stat(normalizedTarget);
    if (!fileStat.isFile()) {
      throw new Error("Resolved asset path is not a regular file");
    }
    fileSize = fileStat.size;
    fileBuffer = await readFile(normalizedTarget);
  } catch (error) {
    // Covers: file missing on disk, permissions error, or the
    // not-a-regular-file guard above. All the same outward response —
    // this is a content/deployment problem, never something to expose
    // details about to the requester.
    log.error("Failed to read challenge asset from disk", error, {
      userId,
      challengeId,
      attachmentId,
      assetKey: attachment.filePath,
    });
    return notFound();
  }

  log.info("Challenge attachment served", {
    userId,
    challengeId,
    attachmentId,
  });

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${sanitizeFileName(
        attachment.fileName,
      )}"`,
      "Content-Length": String(fileSize),
      // Never cached by a shared/CDN cache — this response's
      // authorization was just evaluated per-user; a cached copy would
      // silently bypass that check for the next requester. See Change 7
      // (cache safety) from the previous session.
      "Cache-Control": "private, no-store",
    },
  });
}

/** Strips characters that could break the Content-Disposition header value or enable header injection via a crafted fileName. */
function sanitizeFileName(name: string): string {
  return name.replace(/["\r\n]/g, "_");
}

export function isSafeRelativePath(relativePath: string): boolean {
  if (relativePath.length === 0) return false;
  if (relativePath.startsWith("/")) return false;
  if (relativePath.includes("..")) return false;
  if (/^[a-zA-Z]:[\\/]/.test(relativePath)) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(relativePath)) return false;
  return true;
}