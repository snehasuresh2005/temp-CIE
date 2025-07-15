/*
  Warnings:

  - You are about to drop the column `completed_by` on the `Insight` table. All the data in the column will be lost.
  - You are about to drop the column `developer_id` on the `Insight` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Insight" DROP COLUMN "completed_by",
DROP COLUMN "developer_id",
ADD COLUMN     "rejection_reason" TEXT;
