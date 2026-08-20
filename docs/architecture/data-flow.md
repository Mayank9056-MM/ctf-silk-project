# Data Flow

## Player flow

```mermaid
sequenceDiagram
    participant Player
    participant UI
    participant Action
    participant Service
    participant DB

    Player->>UI: Register or log in
    UI->>Action: Auth Server Action
    Action->>Service: AuthService
    Service->>DB: User / RefreshToken / AuditLog
    Service-->>UI: HttpOnly cookies + public user DTO
    Player->>UI: Open story
    UI->>Action: getCurrentScene / advance / selectChoice
    Action->>Service: Story services
    Service->>DB: StoryProgress / SceneCompletion / ChoiceSelection
    Player->>UI: Open challenge gate
    UI->>Action: getChallenge
    Action->>Service: ChallengeService
    Service->>DB: Challenge + StoryProgress + prerequisite solves
    Player->>UI: Submit flag
    UI->>Action: submitFlag
    Action->>Service: SubmissionService
    Service->>DB: Submission / ChallengeSolve / LeaderboardEntry
```

## Event gate flow

Event access is derived from the singleton `Event` row and its `EventControl` row. Services that can affect gameplay or competitive fairness call `eventService.getEventAccess()` and fail closed when the event is not accessible, paused, not started, or ended.

## Challenge access flow

Challenge access is not based on a client-provided chapter, slug, or scene. The server reads the player's `StoryProgress.currentSceneId`, loads that scene, requires the scene to be a published `CHALLENGE_GATE`, verifies that `scene.challengeId` equals the requested challenge, and checks challenge prerequisites against `ChallengeSolve` rows.

## Scoring flow

Correct submissions create a `Submission` row and a `ChallengeSolve` row in one transaction. The composite primary key on `ChallengeSolve(userId, challengeId)` prevents duplicate solves. The same transaction updates `LeaderboardEntry` via an atomic SQL upsert. Hint purchases can decrement `LeaderboardEntry.totalXp` when the hint has a positive cost.

## Admin flow

Admin pages call admin Server Actions that require super-admin capabilities. Event controls mutate `EventControl`; player management mutates `User` status/password state and refresh tokens; leaderboard controls mutate `Event.leaderboardFrozenAt`; announcements and audit pages read/write their own modules.
