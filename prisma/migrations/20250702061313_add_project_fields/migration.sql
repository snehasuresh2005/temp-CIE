-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "department" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "mentor" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "studentsRequired" INTEGER NOT NULL DEFAULT 1;
