-- DropIndex
DROP INDEX "unlock_rules_targetType_targetId_idx";

-- CreateIndex
CREATE INDEX "unlock_rules_targetType_targetId_createdAt_idx" ON "unlock_rules"("targetType", "targetId", "createdAt");
