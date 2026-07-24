-- CreateEnum
CREATE TYPE "ChallengeAttachmentType" AS ENUM ('IMAGE', 'PDF', 'AUDIO', 'VIDEO', 'ARCHIVE', 'OTHER');

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "chapter" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "flagHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_attachments" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "type" "ChallengeAttachmentType" NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100),
    "filePath" VARCHAR(500) NOT NULL,
    "fileSize" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_prerequisites" (
    "challengeId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_prerequisites_pkey" PRIMARY KEY ("challengeId","prerequisiteId")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenges_slug_key" ON "challenges"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "challenges_chapter_displayOrder_key" ON "challenges"("chapter", "displayOrder");

-- CreateIndex
CREATE INDEX "challenge_attachments_challengeId_idx" ON "challenge_attachments"("challengeId");

-- CreateIndex
CREATE INDEX "challenge_prerequisites_prerequisiteId_idx" ON "challenge_prerequisites"("prerequisiteId");

-- AddForeignKey
ALTER TABLE "challenge_attachments" ADD CONSTRAINT "challenge_attachments_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_prerequisites" ADD CONSTRAINT "challenge_prerequisites_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_prerequisites" ADD CONSTRAINT "challenge_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
