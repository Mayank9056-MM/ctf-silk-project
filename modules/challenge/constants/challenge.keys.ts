export const challengeKeys = {
  all: ["challenges"] as const,                              // plural
  detail: (challengeId: string) => ["challenge", challengeId] as const,  // singular
};