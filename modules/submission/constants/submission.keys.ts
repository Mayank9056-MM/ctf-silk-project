/**
 * TanStack Query key registry for the submission module. Mirrors
 * challengeKeys' shape — a plain array constant for the collection-level
 * key, no function needed since there's exactly one "mine" per
 * authenticated session (unlike challengeKeys.detail(slug), which is
 * parameterized because there are many challenges).
 */
export const submissionKeys = {
  mine: ["submissions", "mine"] as const,
};
