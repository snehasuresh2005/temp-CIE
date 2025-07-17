-- CreateEnum
CREATE TYPE "EnrolmentStatus" AS ENUM ('NOT_STARTED', 'OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "enrolmentCap" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "enrolmentStatus" "EnrolmentStatus" NOT NULL DEFAULT 'NOT_STARTED';
