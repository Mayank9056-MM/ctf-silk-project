-- CreateEnum
CREATE TYPE "EventOperationalMode" AS ENUM ('NORMAL', 'PAUSED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SecuritySignalType" AS ENUM ('AUTH_FAILURE_SPIKE', 'AUTHORIZATION_DENIED_SPIKE', 'RATE_LIMIT_VIOLATION', 'ABNORMAL_REQUEST_VOLUME', 'INVALID_RESOURCE_ACCESS', 'SUBMISSION_ANOMALY', 'AUTHENTICATION_ANOMALY', 'REFRESH_TOKEN_REUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "SecuritySignalStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SecurityAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('SECURITY', 'AVAILABILITY', 'PERFORMANCE', 'DATA_INTEGRITY', 'GAMEPLAY', 'OPERATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'MITIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "IncidentTimelineEntryType" AS ENUM ('STATUS_CHANGED', 'NOTE_ADDED', 'ACTION_TAKEN', 'ASSIGNMENT_CHANGED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'EVENT_PAUSED';
ALTER TYPE "AuditAction" ADD VALUE 'EVENT_RESUMED';
ALTER TYPE "AuditAction" ADD VALUE 'REGISTRATION_ENABLED';
ALTER TYPE "AuditAction" ADD VALUE 'REGISTRATION_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBMISSIONS_ENABLED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBMISSIONS_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE 'READ_ONLY_MODE_ENABLED';
ALTER TYPE "AuditAction" ADD VALUE 'READ_ONLY_MODE_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE 'MAINTENANCE_MODE_ENABLED';
ALTER TYPE "AuditAction" ADD VALUE 'MAINTENANCE_MODE_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE 'SECURITY_SIGNAL_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'SECURITY_ALERT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'SECURITY_ALERT_ACKNOWLEDGED';
ALTER TYPE "AuditAction" ADD VALUE 'SECURITY_ALERT_RESOLVED';
ALTER TYPE "AuditAction" ADD VALUE 'SECURITY_ALERT_DISMISSED';
ALTER TYPE "AuditAction" ADD VALUE 'INCIDENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'INCIDENT_ACKNOWLEDGED';
ALTER TYPE "AuditAction" ADD VALUE 'INCIDENT_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'INCIDENT_RESOLVED';
ALTER TYPE "AuditAction" ADD VALUE 'INCIDENT_CLOSED';
ALTER TYPE "AuditAction" ADD VALUE 'EMERGENCY_OPERATION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditResourceType" ADD VALUE 'EVENT_CONTROL';
ALTER TYPE "AuditResourceType" ADD VALUE 'SECURITY_SIGNAL';
ALTER TYPE "AuditResourceType" ADD VALUE 'SECURITY_ALERT';
ALTER TYPE "AuditResourceType" ADD VALUE 'INCIDENT';

-- CreateTable
CREATE TABLE "event_controls" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "mode" "EventOperationalMode" NOT NULL DEFAULT 'NORMAL',
    "registrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "submissionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "readOnlyMode" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" TIMESTAMPTZ(3),
    "pauseReason" VARCHAR(255),
    "pausedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_signals" (
    "id" TEXT NOT NULL,
    "type" "SecuritySignalType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "status" "SecuritySignalStatus" NOT NULL DEFAULT 'OPEN',
    "userId" TEXT,
    "source" VARCHAR(60) NOT NULL,
    "ipAddress" VARCHAR(45),
    "context" JSONB,
    "relatedAuditLogId" TEXT,
    "alertId" TEXT,
    "investigationNotes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "security_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "severity" "Severity" NOT NULL,
    "status" "SecurityAlertStatus" NOT NULL DEFAULT 'OPEN',
    "userId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolutionNotes" TEXT,
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "severity" "Severity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "acknowledgedById" TEXT,
    "assignedToId" TEXT,
    "resolvedById" TEXT,
    "relatedUserId" TEXT,
    "impact" TEXT,
    "resolution" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_timeline_entries" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "type" "IncidentTimelineEntryType" NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_timeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_controls_eventId_key" ON "event_controls"("eventId");

-- CreateIndex
CREATE INDEX "security_signals_userId_occurredAt_idx" ON "security_signals"("userId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "security_signals_status_severity_occurredAt_idx" ON "security_signals"("status", "severity", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "security_signals_ipAddress_occurredAt_idx" ON "security_signals"("ipAddress", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "security_signals_alertId_idx" ON "security_signals"("alertId");

-- CreateIndex
CREATE INDEX "security_signals_relatedAuditLogId_idx" ON "security_signals"("relatedAuditLogId");

-- CreateIndex
CREATE INDEX "security_alerts_status_severity_triggeredAt_idx" ON "security_alerts"("status", "severity", "triggeredAt" DESC);

-- CreateIndex
CREATE INDEX "security_alerts_userId_triggeredAt_idx" ON "security_alerts"("userId", "triggeredAt" DESC);

-- CreateIndex
CREATE INDEX "security_alerts_incidentId_idx" ON "security_alerts"("incidentId");

-- CreateIndex
CREATE INDEX "incidents_status_severity_detectedAt_idx" ON "incidents"("status", "severity", "detectedAt" DESC);

-- CreateIndex
CREATE INDEX "incidents_assignedToId_status_idx" ON "incidents"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "incidents_createdById_idx" ON "incidents"("createdById");

-- CreateIndex
CREATE INDEX "incidents_relatedUserId_detectedAt_idx" ON "incidents"("relatedUserId", "detectedAt" DESC);

-- CreateIndex
CREATE INDEX "incident_timeline_entries_incidentId_occurredAt_idx" ON "incident_timeline_entries"("incidentId", "occurredAt");

-- AddForeignKey
ALTER TABLE "event_controls" ADD CONSTRAINT "event_controls_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_controls" ADD CONSTRAINT "event_controls_pausedById_fkey" FOREIGN KEY ("pausedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_signals" ADD CONSTRAINT "security_signals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_signals" ADD CONSTRAINT "security_signals_relatedAuditLogId_fkey" FOREIGN KEY ("relatedAuditLogId") REFERENCES "audit_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_signals" ADD CONSTRAINT "security_signals_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "security_alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_timeline_entries" ADD CONSTRAINT "incident_timeline_entries_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_timeline_entries" ADD CONSTRAINT "incident_timeline_entries_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
