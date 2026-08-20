# Testing

## Current state

No dedicated automated test framework or `npm test` script was found in `package.json`. ESLint and production build are the available programmatic checks.

## Available checks

```bash
npm run lint
npm run build
```

## Recommended test coverage

- Auth: registration gates, login lockout, refresh-token rotation/reuse, cookie behavior.
- Story: current-scene bootstrap, scene advancement, choices, evidence unlocks, replay and restart.
- Challenge: access denial, prerequisite enforcement, attachment authorization, DTO redaction.
- Submission: incorrect attempts, correct solves, duplicate solve races, rate limits, leaderboard update.
- Leaderboard: tie-breaking, frozen cutoff, admin live behavior.
- Admin: role enforcement, player moderation concurrency, event pause/resume.
- Security: no raw flags/secrets in client DTOs; generic not-found behavior for protected content.
