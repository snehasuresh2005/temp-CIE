/*
  Warnings:

  - You are about to drop the column `rejection_reason` on the `Insight` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Insight" DROP COLUMN "rejection_reason",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "rectifiedImage" TEXT,
ADD COLUMN     "rejectionReason" TEXT;
