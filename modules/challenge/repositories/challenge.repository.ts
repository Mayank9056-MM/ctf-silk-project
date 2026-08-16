import prisma from "@/lib/prisma";

export class ChallengeRepository {
  async findAll() {
    return prisma.challenge.findMany({
      omit: { flagHash: true },
      include: { attachments: { orderBy: { order: "asc" } } },
      orderBy: [{ chapter: { order: "asc" } }, { displayOrder: "asc" }],
    });
  }

  async findById(id: string) {
    return prisma.challenge.findUnique({
      where: { id },
      omit: { flagHash: true },
      include: { attachments: { orderBy: { order: "asc" } } },
    });
  }

  async findBySlug(slug: string) {
    return prisma.challenge.findUnique({
      where: { slug },
      omit: { flagHash: true },
      include: { attachments: { orderBy: { order: "asc" } } },
    });
  }

  async findByChapter(chapterId: string) {
    return prisma.challenge.findMany({
      where: {
        chapterId,
      },
      omit: { flagHash: true },
      include: {
        attachments: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        displayOrder: "asc",
      },
    });
  }

  async findWithPrerequisites(id: string) {
    return prisma.challenge.findUnique({
      where: { id },
      omit: { flagHash: true },
      include: {
        attachments: true,
        prerequisites: {
          include: { prerequisite: { omit: { flagHash: true } } },
        },
      },
    });
  }

  async exists(id: string) {
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: { id: true },
    });
    return challenge != null;
  }

  /**
   * The ONLY method allowed to return flagHash. Every other method omits
   * it at the query level, not via downstream destructuring.
   */
  async getFlagVerificationData(id: string) {
    return prisma.challenge.findUnique({
      where: { id },
      select: { flagHash: true, xpReward: true },
    });
  }

  /**
   * A single attachment, scoped to its parent challenge — used by the
   * attachment-download route. Filtering by BOTH challengeId and id (not
   * just id) is deliberate: it means a caller can never fetch an
   * attachment by id alone and have it silently resolve under the wrong
   * challenge, which matters here because the route's authorization
   * check is performed against `challengeId`, not `attachmentId`.
   */
  async findAttachmentForChallenge(challengeId: string, attachmentId: string) {
    return prisma.challengeAttachment.findFirst({
      where: { id: attachmentId, challengeId },
    });
  }
}

export const challengeRepository = new ChallengeRepository();
