// modules/submission/repositories/submission.repository.ts
import type {
  Prisma,
  ChallengeSolve,
} from "@/app/generated/prisma/client";
import type { DbClient } from "@/lib/prisma";
import type {
  SubmissionRecord,
  SubmissionWithChallenge,
  SolveRecord,
} from "../types/submission.types";

class SubmissionRepository {
  private readonly challengeSummary = {
    select: { id: true, title: true, slug: true },
  } as const;

  private readonly omitHash = { submittedFlagHash: true } as const;

  // ---- Submission ----

  async createSubmission(
    db: DbClient,
    data: Prisma.SubmissionCreateInput,
  ): Promise<SubmissionRecord> {
    return db.submission.create({ data, omit: this.omitHash });
  }

  async findSubmissionsByUser(
    db: DbClient,
    userId: string,
  ): Promise<SubmissionWithChallenge[]> {
    return db.submission.findMany({
      where: { userId },
      omit: this.omitHash,
      include: { challenge: this.challengeSummary },
      orderBy: { submittedAt: "desc" },
    });
  }

  async findSubmissionsByUserAndChallenge(
    db: DbClient,
    userId: string,
    challengeId: string,
  ): Promise<SubmissionRecord[]> {
    return db.submission.findMany({
      where: { userId, challengeId },
      omit: this.omitHash,
      orderBy: { submittedAt: "asc" },
    });
  }

  async countRecentSubmissions(
    db: DbClient,
    userId: string,
    since: Date,
  ): Promise<number> {
    return db.submission.count({
      where: { userId, submittedAt: { gte: since } },
    });
  }

  async findSubmissionById(
    db: DbClient,
    id: string,
  ): Promise<SubmissionRecord | null> {
    return db.submission.findUnique({ where: { id }, omit: this.omitHash });
  }

  // ---- ChallengeSolve (no omit used — unaffected by this bug) ----

  async createSolve(
    db: DbClient,
    data: Prisma.ChallengeSolveCreateInput,
  ): Promise<ChallengeSolve> {
    return db.challengeSolve.create({ data });
  }

  async findSolveByUserAndChallenge(
    db: DbClient,
    userId: string,
    challengeId: string,
  ): Promise<SolveRecord | null> {
    return db.challengeSolve.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
  }

  async existsSolveByUserAndChallenge(
    db: DbClient,
    userId: string,
    challengeId: string,
  ): Promise<boolean> {
    const solve = await db.challengeSolve.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
      select: { userId: true },
    });
    return solve != null;
  }

  async findSolvesByUser(db: DbClient, userId: string): Promise<SolveRecord[]> {
    return db.challengeSolve.findMany({
      where: { userId },
      orderBy: { solvedAt: "asc" },
    });
  }

  async getTotalXpForUser(db: DbClient, userId: string): Promise<number> {
    const result = await db.challengeSolve.aggregate({
      where: { userId },
      _sum: { xpAwarded: true },
    });
    return result._sum.xpAwarded ?? 0;
  }

  async countSolvesByChallenge(
    db: DbClient,
    challengeId: string,
  ): Promise<number> {
    return db.challengeSolve.count({ where: { challengeId } });
  }
}

export const submissionRepository = new SubmissionRepository();
