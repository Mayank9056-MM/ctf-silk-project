import type {
  SubmissionWithChallenge,
  SubmitFlagOutcome,
} from "../types/submission.types";
import type {
  SubmissionDTO,
  SubmitFlagResultDTO,
} from "../types/submission.dto";

/**
 * The one place allowed to read submittedFlagHash (implicitly, by having
 * access to the full internal type) and choose not to forward it. Every
 * action in this module should return the result of this function, never
 * a raw repository/service result.
 */
export function toSubmissionDTO(submission: SubmissionWithChallenge): SubmissionDTO {
  return {
    id: submission.id,
    challengeId: submission.challengeId,
    challengeTitle: submission.challenge.title,
    challengeSlug: submission.challenge.slug,
    isCorrect: submission.isCorrect,
    submittedAt: submission.submittedAt,
  };
}

export function toSubmissionDTOList(
  submissions: SubmissionWithChallenge[],
): SubmissionDTO[] {
  return submissions.map(toSubmissionDTO);
}

/**
 * Attaches the player-facing message to a submit outcome. Message text
 * lives here, not in the service — SubmissionService.submitFlag() returns
 * facts (isCorrect/xpAwarded/alreadySolved); this function is the one
 * place that turns those facts into copy, so wording changes never touch
 * business logic.
 */
export function toSubmitFlagResultDTO(outcome: SubmitFlagOutcome): SubmitFlagResultDTO {
  return {
    ...outcome,
    message: getSubmitFlagMessage(outcome),
  };
}

function getSubmitFlagMessage(outcome: SubmitFlagOutcome): string {
  if (!outcome.isCorrect) return "Incorrect flag.";
  if (outcome.alreadySolved) return "Already solved — no additional XP awarded.";
  return `Correct! +${outcome.xpAwarded} XP`;
}