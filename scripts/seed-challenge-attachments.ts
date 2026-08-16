// scripts/seed-challenge-attachments.ts
// ============================================================================
// Owns ChallengeAttachment rows exclusively. Runs AFTER seed-challenges.ts
// (needs real Challenge.id via slug) and has no dependency on seed-story.ts
// either direction — attachments aren't referenced by Scene at all.
//
// filePath stores the ASSET KEY (e.g. "the-pattern-tutorial-case-files"),
// never a literal path — see challenge-assets.ts's own header for why.
// Every key here MUST also exist in CHALLENGE_ASSETS or the attachment
// route will 404 it at request time even though the DB row exists.
//
// fileSize is read from the real file on disk via fs.stat rather than
// hand-typed, so it can never drift from the actual bytes being served —
// same "don't hand-maintain something the filesystem already knows"
// reasoning as everything else in this seed layer.
// ============================================================================

import { stat } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { ChallengeAttachmentType } from "@/app/generated/prisma/enums";
import { resolveChallengeAsset, isKnownChallengeAssetKey } from "@/lib/assets/challenge-assets";
import "dotenv/config";

const ASSETS_ROOT = path.join(process.cwd(), "assets");

interface AttachmentSeed {
  challengeSlug: string;
  assetKey: string;
  fileName: string;
  type: ChallengeAttachmentType;
  mimeType: string;
  order: number;
}

const ATTACHMENTS: AttachmentSeed[] = [
  {
    challengeSlug: "the-pattern-tutorial",
    assetKey: "the-pattern-tutorial-case-files",
    fileName: "case-files-overview.png",
    type: ChallengeAttachmentType.IMAGE,
    mimeType: "image/png",
    order: 1,
  },
];

export async function seedChallengeAttachments(): Promise<void> {
  let seeded = 0;

  for (const attachment of ATTACHMENTS) {
    if (!isKnownChallengeAssetKey(attachment.assetKey)) {
      console.warn(
        `[seed-challenge-attachments] Skipping "${attachment.fileName}" — asset key "${attachment.assetKey}" is not registered in CHALLENGE_ASSETS. Add it there first.`,
      );
      continue;
    }

    const relativePath = resolveChallengeAsset(attachment.assetKey);
    if (relativePath) {
      const absolutePath = path.join(ASSETS_ROOT, relativePath);
      try {
        await stat(absolutePath);
      } catch {
        console.warn(
          `[seed-challenge-attachments] Asset key "${attachment.assetKey}" resolves to "${relativePath}", but no file exists there yet at ${absolutePath} — creating the DB row anyway, but downloads will 404 until the file is added.`,
        );
      }
    }

    const challenge = await prisma.challenge.findUnique({
      where: { slug: attachment.challengeSlug },
      select: { id: true },
    });

    if (!challenge) {
      console.warn(
        `[seed-challenge-attachments] Skipping "${attachment.fileName}" — no challenge found for slug "${attachment.challengeSlug}". Did seed-challenges run first?`,
      );
      continue;
    }

    let fileSize: number | null = null;
    if (relativePath) {
      try {
        const fileStat = await stat(path.join(ASSETS_ROOT, relativePath));
        fileSize = fileStat.size;
      } catch {
        fileSize = null; // file missing — see warning above
      }
    }

    const existing = await prisma.challengeAttachment.findFirst({
      where: { challengeId: challenge.id, filePath: attachment.assetKey },
      select: { id: true },
    });

    if (existing) {
      await prisma.challengeAttachment.update({
        where: { id: existing.id },
        data: {
          fileName: attachment.fileName,
          type: attachment.type,
          mimeType: attachment.mimeType,
          fileSize,
          order: attachment.order,
        },
      });
    } else {
      await prisma.challengeAttachment.create({
        data: {
          challengeId: challenge.id,
          filePath: attachment.assetKey,
          fileName: attachment.fileName,
          type: attachment.type,
          mimeType: attachment.mimeType,
          fileSize,
          order: attachment.order,
        },
      });
    }

    seeded += 1;
  }

  console.log(`[seed-challenge-attachments] ${seeded} attachment(s) ready.`);
}

if (require.main === module) {
  seedChallengeAttachments()
    .catch((error) => {
      console.error("[seed-challenge-attachments] Failed:", error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}