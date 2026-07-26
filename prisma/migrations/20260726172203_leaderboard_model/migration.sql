-- AlterTable
ALTER TABLE "events" ADD COLUMN     "leaderboardFrozenAt" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "userId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "solvedChallenges" INTEGER NOT NULL DEFAULT 0,
    "lastSolvedAt" TIMESTAMP(3),
    "highestChapter" INTEGER NOT NULL DEFAULT 0,
    "highestDisplayOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "leaderboard_entries_totalXp_solvedChallenges_lastSolvedAt_idx" ON "leaderboard_entries"("totalXp" DESC, "solvedChallenges" DESC, "lastSolvedAt" ASC);

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
