/*
  Warnings:

  - You are about to drop the column `isPublished` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `pauseReason` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `pausedAt` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "isPublished",
DROP COLUMN "pauseReason",
DROP COLUMN "pausedAt";
