import prisma from "@/lib/prisma";

export class ChallengeRepository {
  private readonly attachmentsOrder = { orderBy: { order: "asc" as const } };

  async findAll() {
    return prisma.challenge.findMany({
      omit: { flagHash: true },
      include: { attachments: this.attachmentsOrder },
      orderBy: [{ chapter: "asc" }, { displayOrder: "asc" }],
    });
  }

  async findById(id: string) {
    return prisma.challenge.findUnique({
      where: { id },
      omit: { flagHash: true },
      include: { attachments: this.attachmentsOrder },
    });
  }

  async findBySlug(slug: string) {
    return prisma.challenge.findUnique({
      where: { slug },
      omit: { flagHash: true },
      include: { attachments: this.attachmentsOrder },
    });
  }

  async findByChapter(chapter: number) {
    return prisma.challenge.findMany({
      where: { chapter },
      omit: { flagHash: true },
      include: { attachments: this.attachmentsOrder },
      orderBy: { displayOrder: "asc" },
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
}

export const challengeRepository = new ChallengeRepository();
