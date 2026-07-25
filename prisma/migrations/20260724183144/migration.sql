-- DropForeignKey
ALTER TABLE "challenge_prerequisites" DROP CONSTRAINT "challenge_prerequisites_prerequisiteId_fkey";

-- CreateIndex
CREATE INDEX "challenge_prerequisites_challengeId_idx" ON "challenge_prerequisites"("challengeId");

-- AddForeignKey
ALTER TABLE "challenge_prerequisites" ADD CONSTRAINT "challenge_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
