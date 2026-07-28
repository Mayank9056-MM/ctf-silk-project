/*
  Warnings:

  - You are about to drop the column `chapter` on the `challenges` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[chapterId,displayOrder]` on the table `challenges` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chapterId` to the `challenges` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SceneType" AS ENUM ('DIALOGUE', 'CUTSCENE', 'EVIDENCE_REVEAL', 'CHALLENGE_GATE', 'CHOICE');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('CHAT_LOG', 'WALLET_LEDGER', 'GPS_PIN', 'PHOTOGRAPH', 'SURVEILLANCE_FOOTAGE', 'FINGERPRINT', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "UnlockTargetType" AS ENUM ('CHAPTER', 'SCENE', 'EVIDENCE');

-- CreateEnum
CREATE TYPE "UnlockConditionType" AS ENUM ('CHALLENGE_SOLVED', 'CHAPTER_COMPLETED', 'SCENE_COMPLETED', 'CHOICE_SELECTED', 'EVENT_LIVE');

-- CreateEnum
CREATE TYPE "StoryProgressStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- DropIndex
DROP INDEX "challenges_chapter_displayOrder_key";

-- AlterTable
ALTER TABLE "challenges" DROP COLUMN "chapter",
ADD COLUMN     "chapterId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenes" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(150),
    "type" "SceneType" NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "challengeId" TEXT,
    "evidenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "portraitUrl" VARCHAR(500),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialogue_lines" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "characterId" TEXT,
    "order" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "audioUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialogue_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "choices" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "nextSceneId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentUrl" VARCHAR(500),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unlock_rules" (
    "id" TEXT NOT NULL,
    "targetType" "UnlockTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "conditionType" "UnlockConditionType" NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unlock_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_progress" (
    "userId" TEXT NOT NULL,
    "currentChapterId" TEXT,
    "currentSceneId" TEXT,
    "status" "StoryProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "story_progress_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "scene_completions" (
    "userId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scene_completions_pkey" PRIMARY KEY ("userId","sceneId")
);

-- CreateTable
CREATE TABLE "choice_selections" (
    "userId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "choiceId" TEXT NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "choice_selections_pkey" PRIMARY KEY ("userId","sceneId")
);

-- CreateIndex
CREATE UNIQUE INDEX "chapters_slug_key" ON "chapters"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_order_key" ON "chapters"("order");

-- CreateIndex
CREATE INDEX "scenes_challengeId_idx" ON "scenes"("challengeId");

-- CreateIndex
CREATE INDEX "scenes_evidenceId_idx" ON "scenes"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "scenes_chapterId_slug_key" ON "scenes"("chapterId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "scenes_chapterId_order_key" ON "scenes"("chapterId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "characters_slug_key" ON "characters"("slug");

-- CreateIndex
CREATE INDEX "dialogue_lines_characterId_idx" ON "dialogue_lines"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "dialogue_lines_sceneId_order_key" ON "dialogue_lines"("sceneId", "order");

-- CreateIndex
CREATE INDEX "choices_nextSceneId_idx" ON "choices"("nextSceneId");

-- CreateIndex
CREATE UNIQUE INDEX "choices_sceneId_order_key" ON "choices"("sceneId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_slug_key" ON "evidence"("slug");

-- CreateIndex
CREATE INDEX "unlock_rules_targetType_targetId_idx" ON "unlock_rules"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "scene_completions_sceneId_idx" ON "scene_completions"("sceneId");

-- CreateIndex
CREATE INDEX "choice_selections_choiceId_idx" ON "choice_selections"("choiceId");

-- CreateIndex
CREATE UNIQUE INDEX "challenges_chapterId_displayOrder_key" ON "challenges"("chapterId", "displayOrder");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialogue_lines" ADD CONSTRAINT "dialogue_lines_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialogue_lines" ADD CONSTRAINT "dialogue_lines_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choices" ADD CONSTRAINT "choices_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choices" ADD CONSTRAINT "choices_nextSceneId_fkey" FOREIGN KEY ("nextSceneId") REFERENCES "scenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_progress" ADD CONSTRAINT "story_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_progress" ADD CONSTRAINT "story_progress_currentChapterId_fkey" FOREIGN KEY ("currentChapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_progress" ADD CONSTRAINT "story_progress_currentSceneId_fkey" FOREIGN KEY ("currentSceneId") REFERENCES "scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_completions" ADD CONSTRAINT "scene_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_completions" ADD CONSTRAINT "scene_completions_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choice_selections" ADD CONSTRAINT "choice_selections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choice_selections" ADD CONSTRAINT "choice_selections_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choice_selections" ADD CONSTRAINT "choice_selections_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "choices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
