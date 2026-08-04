-- CreateEnum
CREATE TYPE "HintLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3');

-- CreateTable
CREATE TABLE "hints" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "level" "HintLevel" NOT NULL,
    "xpCost" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_hints" (
    "userId" TEXT NOT NULL,
    "hintId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpSpent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "player_hints_pkey" PRIMARY KEY ("userId","hintId")
);

-- CreateIndex
CREATE INDEX "hints_challengeId_level_idx" ON "hints"("challengeId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "hints_challengeId_level_key" ON "hints"("challengeId", "level");

-- CreateIndex
CREATE INDEX "player_hints_hintId_idx" ON "player_hints"("hintId");

-- AddForeignKey
ALTER TABLE "hints" ADD CONSTRAINT "hints_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_hints" ADD CONSTRAINT "player_hints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_hints" ADD CONSTRAINT "player_hints_hintId_fkey" FOREIGN KEY ("hintId") REFERENCES "hints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
