/*
  Warnings:

  - You are about to drop the column `code` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `credits` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `enrolled_students` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `faculty_id` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `max_students` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `sections` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `enrollments` table. All the data in the column will be lost.
  - Added the required column `course_description` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_end_date` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_name` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_start_date` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modified_date` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_faculty_id_fkey";

-- DropIndex
DROP INDEX "courses_code_key";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "code",
DROP COLUMN "credits",
DROP COLUMN "department",
DROP COLUMN "description",
DROP COLUMN "enrolled_students",
DROP COLUMN "faculty_id",
DROP COLUMN "max_students",
DROP COLUMN "name",
DROP COLUMN "sections",
DROP COLUMN "semester",
DROP COLUMN "status",
ADD COLUMN     "course_description" TEXT NOT NULL,
ADD COLUMN     "course_end_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "course_enrollments" TEXT[],
ADD COLUMN     "course_name" TEXT NOT NULL,
ADD COLUMN     "course_start_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "modified_by" TEXT,
ADD COLUMN     "modified_date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "section",
ADD COLUMN     "grade" TEXT;
