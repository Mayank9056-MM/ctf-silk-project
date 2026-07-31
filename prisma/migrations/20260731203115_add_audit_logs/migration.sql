-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'REGISTER', 'USER_BANNED', 'USER_UNBANNED', 'USER_ROLE_CHANGED', 'CHALLENGE_CREATED', 'CHALLENGE_UPDATED', 'CHALLENGE_DELETED', 'CHALLENGE_PUBLISHED', 'CHALLENGE_UNPUBLISHED', 'ATTACHMENT_UPLOADED', 'ATTACHMENT_DELETED', 'CHAPTER_CREATED', 'CHAPTER_UPDATED', 'CHAPTER_DELETED', 'CHAPTER_PUBLISHED', 'CHAPTER_UNPUBLISHED', 'SCENE_CREATED', 'SCENE_UPDATED', 'SCENE_DELETED', 'SCENE_PUBLISHED', 'SCENE_UNPUBLISHED', 'STORY_RESTARTED', 'FIRST_BLOOD', 'LEADERBOARD_FROZEN', 'LEADERBOARD_UNFROZEN', 'EVENT_UPDATED', 'EXPORT_LEADERBOARD', 'EXPORT_SUBMISSIONS', 'EXPORT_AUDIT');

-- CreateEnum
CREATE TYPE "AuditResourceType" AS ENUM ('USER', 'EVENT', 'CHALLENGE', 'SUBMISSION', 'CHAPTER', 'SCENE', 'LEADERBOARD', 'SYSTEM');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT,
    "actorUsername" VARCHAR(30),
    "actorRole" "Role",
    "action" "AuditAction" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reason" VARCHAR(255),
    "resourceType" "AuditResourceType" NOT NULL,
    "resourceId" TEXT,
    "resourceName" VARCHAR(200),
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(255),
    "requestId" VARCHAR(100),
    "sessionId" VARCHAR(100),
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_occurredAt_idx" ON "audit_logs"("occurredAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_idx" ON "audit_logs"("resourceType");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_idx" ON "audit_logs"("resourceId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
