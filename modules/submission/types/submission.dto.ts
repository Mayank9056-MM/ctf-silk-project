export interface SubmissionDTO {
  id: string;
  challengeId: string;
  challengeTitle: string;
  challengeSlug: string;
  isCorrect: boolean;
  submittedAt: Date;
}

export interface SubmitFlagResultDTO {
  isCorrect: boolean;
  xpAwarded: number;
  alreadySolved: boolean;
  message: string;
}
