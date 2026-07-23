/*
  Warnings:

  - You are about to drop the column `endAt` on the `events` table. All the data in the column will be lost.
  - Added the required column `endsAt` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "endAt",
ADD COLUMN     "endsAt" TIMESTAMPTZ(3) NOT NULL;
