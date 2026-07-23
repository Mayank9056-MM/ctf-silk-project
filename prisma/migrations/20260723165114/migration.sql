/*
  Warnings:

  - You are about to drop the column `status` on the `events` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "events_status_idx";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "status";

-- DropEnum
DROP TYPE "EventStatus";
