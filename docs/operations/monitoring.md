# Monitoring

## Current implementation

The application includes structured console logger utilities with redaction support and an audit-log table for selected domain/security events. No external monitoring integration, metrics endpoint, tracing, or alerting configuration was found.

## What to monitor

- Authentication failures and lockouts.
- Rate-limit bucket growth and repeated violations.
- Submission volume and incorrect/correct ratio.
- Challenge attachment 404/error rates.
- Leaderboard query latency, especially frozen aggregations.
- Missing event/event-control seed errors.
- Database connection failures and migration drift.

## Recommended additions

Add centralized logs, application metrics, health checks, error tracking, database monitoring, and alerting for event-day critical paths.
