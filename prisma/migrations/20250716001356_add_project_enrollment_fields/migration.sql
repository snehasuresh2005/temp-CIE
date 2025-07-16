/*
  Warnings:

  - You are about to drop the column `enrolmentCap` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `enrolmentStatus` on the `projects` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('NOT_STARTED', 'OPEN', 'CLOSED');

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "enrolmentCap",
DROP COLUMN "enrolmentStatus",
ADD COLUMN     "enrollment_cap" INTEGER,
ADD COLUMN     "enrollment_end_date" TIMESTAMP(3),
ADD COLUMN     "enrollment_start_date" TIMESTAMP(3),
ADD COLUMN     "enrollment_status" "EnrollmentStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- DropEnum
DROP TYPE "EnrolmentStatus";
