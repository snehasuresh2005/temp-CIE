/*
  Warnings:

  - A unique constraint covering the columns `[course_code]` on the table `courses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `course_code` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "course_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "courses_course_code_key" ON "courses"("course_code");
