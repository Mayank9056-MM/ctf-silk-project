# Architectural Decisions

## Module-first organization

The repository groups behavior by domain rather than by technical layer. This keeps gameplay rules discoverable and reduces accidental coupling between unrelated systems.

## Server Actions as application boundary

Most operations are Server Actions because the app is a Next.js App Router application and the UI uses feature hooks to call domain actions. Actions remain thin so business rules live in services and persistence lives in repositories.

## Challenge access derives from story state

The platform treats the story engine as the source of truth for which challenge a player may attempt. This prevents a player from bypassing progression by navigating directly to a challenge ID or posting directly to a submission action.

## Database-enforced idempotency for solves and hints

Duplicate solve protection uses `ChallengeSolve(userId, challengeId)` as a composite primary key. Duplicate hint unlock protection uses `PlayerHint(userId, hintId)` as a composite primary key. The service layer catches relevant Prisma unique-constraint failures and translates them into domain responses.

## Frozen leaderboard is computed from solves

Player-facing frozen leaderboard reads aggregate `ChallengeSolve` rows with `solvedAt <= frozenAt` instead of persisting a snapshot table. This avoids snapshot invalidation but makes frozen reads more query-heavy.

## Private challenge assets

Challenge attachments live under the private `assets/` directory and are served only through an authenticated, challenge-authorized Route Handler. `ChallengeAttachment.filePath` is an allowlisted asset key, not a user-controlled filesystem path.

## Planned security operations schema

Security signals, alerts, and incidents exist in Prisma as future models. The current release documents them as planned because there are no corresponding services, Server Actions, hooks, or UI flows.
