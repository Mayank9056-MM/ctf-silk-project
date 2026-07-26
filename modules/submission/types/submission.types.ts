// modules/submission/types/submission.types.ts
import type { Challenge, ChallengeSolve, Submission } from "@/app/generated/prisma/client";

/**
 * The shape every repository read/write actually returns.
 * submittedFlagHash is write-only, audit-trail data — no code path ever
 * needs to read it back (verification recomputes against
 * Challenge.flagHash directly), so every query omits it at the database
 * level, and this type reflects that structurally instead of trusting
 * every caller to remember it's missing.
 */
export type SubmissionRecord = Omit<Submission, "submittedFlagHash">;

export type SubmissionWithChallenge = SubmissionRecord & {
  challenge: Pick<Challenge, "id" | "title" | "slug">;
};

export type SolveRecord = ChallengeSolve;

export interface SubmitFlagOutcome {
  isCorrect: boolean;
  xpAwarded: number;
  alreadySolved: boolean;
}