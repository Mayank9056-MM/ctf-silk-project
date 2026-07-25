export const challengeKeys = {
  all: ["challenges"] as const,

  detail: (slug: string) =>
    ["challenge", slug] as const,
};