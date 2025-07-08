/*
  Warnings:

  - You are about to drop the column `mentorId` on the `InternshipProject` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `InternshipProject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `facultyId` to the `InternshipProject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `InternshipProject` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "InternshipProject" DROP CONSTRAINT "InternshipProject_mentorId_fkey";

-- DropIndex
DROP INDEX "InternshipProject_mentorId_idx";

-- AlterTable
ALTER TABLE "InternshipProject" DROP COLUMN "mentorId",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "facultyId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "InternshipProject_facultyId_idx" ON "InternshipProject"("facultyId");

-- AddForeignKey
ALTER TABLE "InternshipProject" ADD CONSTRAINT "InternshipProject_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
