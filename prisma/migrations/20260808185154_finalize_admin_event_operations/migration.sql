/*
  Warnings:

  - The values [SUBMISSIONS_ENABLED,SUBMISSIONS_DISABLED,READ_ONLY_MODE_ENABLED,READ_ONLY_MODE_DISABLED,MAINTENANCE_MODE_ENABLED,MAINTENANCE_MODE_DISABLED] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [MAINTENANCE] on the enum `EventOperationalMode` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `readOnlyMode` on the `event_controls` table. All the data in the column will be lost.
  - You are about to drop the column `submissionsEnabled` on the `event_controls` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `event_controls` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('LOGIN', 'LOGOUT', 'REGISTER', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'REFRESH_TOKEN_REUSE_DETECTED', 'PERMISSION_DENIED', 'USER_BANNED', 'USER_UNBANNED', 'USER_ROLE_CHANGED', 'CHALLENGE_CREATED', 'CHALLENGE_UPDATED', 'CHALLENGE_DELETED', 'CHALLENGE_PUBLISHED', 'CHALLENGE_UNPUBLISHED', 'CHALLENGE_FLAG_CHANGED', 'ATTACHMENT_UPLOADED', 'ATTACHMENT_DELETED', 'CHAPTER_CREATED', 'CHAPTER_UPDATED', 'CHAPTER_DELETED', 'CHAPTER_PUBLISHED', 'CHAPTER_UNPUBLISHED', 'SCENE_CREATED', 'SCENE_UPDATED', 'SCENE_DELETED', 'SCENE_PUBLISHED', 'SCENE_UNPUBLISHED', 'EVIDENCE_CREATED', 'EVIDENCE_UPDATED', 'EVIDENCE_DELETED', 'EVIDENCE_PUBLISHED', 'EVIDENCE_UNPUBLISHED', 'UNLOCK_RULE_CREATED', 'UNLOCK_RULE_UPDATED', 'UNLOCK_RULE_DELETED', 'STORY_RESTARTED', 'LEADERBOARD_FROZEN', 'LEADERBOARD_UNFROZEN', 'LEADERBOARD_RECALCULATED', 'SCORE_ADJUSTED', 'EVENT_UPDATED', 'EXPORT_LEADERBOARD', 'EXPORT_SUBMISSIONS', 'EXPORT_AUDIT', 'EVENT_PAUSED', 'EVENT_RESUMED', 'REGISTRATION_ENABLED', 'REGISTRATION_DISABLED', 'SECURITY_SIGNAL_STATUS_CHANGED', 'SECURITY_ALERT_CREATED', 'SECURITY_ALERT_ACKNOWLEDGED', 'SECURITY_ALERT_RESOLVED', 'SECURITY_ALERT_DISMISSED', 'INCIDENT_CREATED', 'INCIDENT_ACKNOWLEDGED', 'INCIDENT_STATUS_CHANGED', 'INCIDENT_RESOLVED', 'INCIDENT_CLOSED', 'EMERGENCY_OPERATION', 'ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT_UPDATED', 'ANNOUNCEMENT_ARCHIVED');
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EventOperationalMode_new" AS ENUM ('NORMAL', 'PAUSED');
ALTER TABLE "public"."event_controls" ALTER COLUMN "mode" DROP DEFAULT;
ALTER TABLE "event_controls" ALTER COLUMN "mode" TYPE "EventOperationalMode_new" USING ("mode"::text::"EventOperationalMode_new");
ALTER TYPE "EventOperationalMode" RENAME TO "EventOperationalMode_old";
ALTER TYPE "EventOperationalMode_new" RENAME TO "EventOperationalMode";
DROP TYPE "public"."EventOperationalMode_old";
ALTER TABLE "event_controls" ALTER COLUMN "mode" SET DEFAULT 'NORMAL';
COMMIT;

-- AlterTable
ALTER TABLE "event_controls" DROP COLUMN "readOnlyMode",
DROP COLUMN "submissionsEnabled",
DROP COLUMN "version";
