# Troubleshooting

## Event not accessible

Check the singleton `Event` and `EventControl` rows. Missing rows cause gated services to fail closed. Run event seed scripts only when safe for the environment.

## Registration closed

Registration depends on derived event access and `EventControl.registrationEnabled`. Admin event-control UI can toggle registration.

## Challenge returns not found

A real challenge can still return not found when the player is not at the matching story challenge gate, the event is inaccessible, the scene is unpublished, or prerequisites are unmet. This is intentional anti-enumeration behavior.

## Attachment download returns 404

Possible causes: unauthenticated request, unauthorized challenge access, attachment not associated with the challenge, missing allowlist entry, missing file under `assets/`, or failed containment checks. Logs contain internal reason details.

## Leaderboard appears frozen

Check `Event.leaderboardFrozenAt`. Player-facing reads aggregate solves before that timestamp; admin reads remain live.

## Build fails on environment validation

Ensure all required variables from [Environment](../development/environment.md) are set and secrets meet minimum length requirements.
